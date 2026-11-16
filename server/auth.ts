import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, pool } from "./db";
import { users } from "@shared/models/auth";
import { initializeLoginProtection, loginAttemptLimit, sameOriginWrites } from "./security";
import { runWithOwner } from "./tenant";
import { isMailConfigured, sendPasswordResetEmail, sendVerificationEmail } from "./mailer";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be configured.");
  }
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: Math.floor(sessionTtl / 1000),
    tableName: "sessions",
    errorLog: () => console.error("Session storage operation failed."),
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

const signupSchema = z.object({
  username: z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9._-]+$/),
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().max(80).optional().default(""),
  lastName: z.string().trim().max(80).optional().default(""),
  password: z.string().min(12).max(128),
  termsAccepted: z.literal(true),
  plan: z.enum(["free", "pro"]).default("free"),
}).strict();

const POLICY_VERSION = "draft-2026-11-16";
const tokenSchema = z.object({ token: z.string().min(32).max(128) }).strict();
const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(12).max(128),
}).strict();

const requiredAccountColumns = [
  "users.account_role",
  "users.subscription_status",
  "users.email_verified_at",
  "users.email_verification_token_hash",
  "users.email_verification_expires_at",
  "users.password_reset_token_hash",
  "users.password_reset_expires_at",
  "users.terms_accepted_at",
  "users.terms_version",
  "users.privacy_notice_version",
  "clients.owner_id",
  "inventory.owner_id",
  "expenses.owner_id",
  "settings.owner_id",
  "dealer_notebook_entries.owner_id",
  "retention_holds.owner_id",
  "transaction_parties.owner_id",
  "retention_audit.owner_id",
  "retention_policies.owner_id",
  "inventory_price_history.owner_id",
  "personal_collection_valuations.owner_id",
];

async function publicAccountSchemaReady(): Promise<boolean> {
  try {
    const { rows } = await pool.query<{ table_name: string; column_name: string }>(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (table_name, column_name) IN (
          SELECT split_part(required, '.', 1), split_part(required, '.', 2)
          FROM unnest($1::text[]) AS required
        )
    `, [requiredAccountColumns]);
    const present = new Set(rows.map(row => `${row.table_name}.${row.column_name}`));
    return requiredAccountColumns.every(column => present.has(column));
  } catch {
    return false;
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profileImageUrl: user.profileImageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    accountRole: user.accountRole,
    subscriptionStatus: user.subscriptionStatus,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

export async function setupAuth(
  app: Express,
  options: { onAccountCreated?: (userId: string) => Promise<void> } = {},
) {
  app.set("trust proxy", 1);
  await initializeLoginProtection();
  app.use("/api", sameOriginWrites);
  app.use(getSession());

  // Registration stays closed until the manual tenant migration and SMTP
  // configuration are both present on the host.
  app.post("/api/register", loginAttemptLimit, async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid username, email, and password of at least 12 characters." });
    if (process.env.PUBLIC_REGISTRATION_ENABLED !== "true" ||
        !isMailConfigured() || !(await publicAccountSchemaReady())) {
      return res.status(503).json({ message: "Account registration is not available on this host yet." });
    }
    const input = { ...parsed.data, email: parsed.data.email.toLowerCase() };
    try {
      const [existing] = await db.select({ id: users.id }).from(users).where(or(
        sql`lower(${users.username}) = ${input.username.toLowerCase()}`,
        sql`lower(${users.email}) = ${input.email.toLowerCase()}`,
      )).limit(1);
      if (existing) {
        // Do not disclose whether a username or an email is already registered.
        return res.status(202).json({ message: "If the details can be used, a verification email will arrive shortly." });
      }

      const token = randomBytes(32).toString("base64url");
      const [user] = await db.insert(users).values({
        username: input.username.toLowerCase(),
        email: input.email.toLowerCase(),
        password: await bcrypt.hash(input.password, 12),
        firstName: input.firstName || null,
        lastName: input.lastName || null,
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        termsAcceptedAt: new Date(),
        termsVersion: POLICY_VERSION,
        privacyNoticeVersion: POLICY_VERSION,
      }).returning();
      await options.onAccountCreated?.(user.id);
      await sendVerificationEmail(user.email!, user.firstName, token, input.plan);
      return res.status(202).json({ message: "If the details can be used, a verification email will arrive shortly." });
    } catch {
      console.error("Account registration could not be completed.");
      return res.status(503).json({ message: "Account registration is temporarily unavailable." });
    }
  });

  app.post("/api/verify-email", loginAttemptLimit, async (req, res) => {
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Verification link is invalid or expired." });
    try {
      const [user] = await db.update(users).set({
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date(),
      }).where(and(
        eq(users.emailVerificationTokenHash, hashToken(parsed.data.token)),
        gt(users.emailVerificationExpiresAt, new Date()),
      )).returning({ id: users.id });
      if (!user) return res.status(400).json({ message: "Verification link is invalid or expired." });
      return res.json({ message: "Email verified. You can now sign in." });
    } catch {
      return res.status(503).json({ message: "Email verification is temporarily unavailable." });
    }
  });

  app.post("/api/resend-verification", loginAttemptLimit, async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!z.string().email().safeParse(email).success || !isMailConfigured()) {
      return res.status(202).json({ message: "If the account needs verification, a message will arrive shortly." });
    }
    try {
      const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`).limit(1);
      if (user && !user.emailVerifiedAt && user.accountRole !== "owner") {
        const token = randomBytes(32).toString("base64url");
        await db.update(users).set({
          emailVerificationTokenHash: hashToken(token),
          emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }).where(eq(users.id, user.id));
        await sendVerificationEmail(email, user.firstName, token);
      }
      return res.status(202).json({ message: "If the account needs verification, a message will arrive shortly." });
    } catch {
      return res.status(202).json({ message: "If the account needs verification, a message will arrive shortly." });
    }
  });

  app.post("/api/password-reset", loginAttemptLimit, async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const generic = { message: "If the account exists, a password reset link will arrive shortly." };
    if (!z.string().email().safeParse(email).success || !isMailConfigured()) return res.status(202).json(generic);
    try {
      const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`).limit(1);
      if (user?.emailVerifiedAt) {
        const token = randomBytes(32).toString("base64url");
        await db.update(users).set({
          passwordResetTokenHash: hashToken(token),
          passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        }).where(eq(users.id, user.id));
        await sendPasswordResetEmail(email, user.firstName, token);
      }
      return res.status(202).json(generic);
    } catch {
      return res.status(202).json(generic);
    }
  });

  app.post("/api/password-reset/confirm", loginAttemptLimit, async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Reset link is invalid or expired." });
    try {
      const [user] = await db.update(users).set({
        password: await bcrypt.hash(parsed.data.password, 12),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        updatedAt: new Date(),
      }).where(and(
        eq(users.passwordResetTokenHash, hashToken(parsed.data.token)),
        gt(users.passwordResetExpiresAt, new Date()),
      )).returning({ id: users.id });
      if (!user) return res.status(400).json({ message: "Reset link is invalid or expired." });
      await pool.query("DELETE FROM sessions WHERE sess->>'userId' = $1", [user.id]);
      return res.json({ message: "Password updated. You can now sign in." });
    } catch {
      return res.status(503).json({ message: "Password reset is temporarily unavailable." });
    }
  });

  // Login endpoint
  app.post("/api/login", loginAttemptLimit, async (req, res) => {
    try {
      const { username, identifier, password } = req.body ?? {};
      const loginId = typeof identifier === "string" ? identifier : username;

      if (typeof loginId !== "string" || typeof password !== "string" ||
          !loginId || !password || loginId.length > 256 || password.length > 1024) {
        return res.status(400).json({ message: "Email or username and password are required." });
      }

      const [user] = await db.select().from(users).where(or(
        sql`lower(${users.username}) = ${loginId.toLowerCase()}`,
        eq(users.email, loginId.toLowerCase()),
      )).limit(1);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      if (!user.emailVerifiedAt && user.accountRole !== "owner") {
        return res.status(403).json({ message: "Verify your email before signing in.", needsEmailVerification: true });
      }

      // Set session
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => err ? reject(err) : resolve());
      });
      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => err ? reject(err) : resolve());
      });
      
      res.json(publicUser(user));
    } catch {
      console.error("Login failed due to an internal error.");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) {
      req.session.destroy(() => {});
      return res.json(null);
    }

    res.json(publicUser(user));
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const [user] = await db.select({
      id: users.id,
      emailVerifiedAt: users.emailVerifiedAt,
      accountRole: users.accountRole,
    }).from(users)
      .where(eq(users.id, req.session.userId)).limit(1);
    if (!user || (!user.emailVerifiedAt && user.accountRole !== "owner")) {
      req.session.destroy(() => {});
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    runWithOwner(user.id, next);
  } catch (error) {
    next(error);
  }
};

export const requirePro: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const [user] = await db.select({
      accountRole: users.accountRole,
      subscriptionStatus: users.subscriptionStatus,
    }).from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (user.accountRole !== "owner" && !["active", "trialing"].includes(user.subscriptionStatus)) {
      res.status(402).json({ message: "AI features are included with WRISTBY Pro. Upgrade from Account & plan." });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};
