import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { denyRegistration, initializeLoginProtection, loginAttemptLimit, sameOriginWrites } from "./security";

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

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  await initializeLoginProtection();
  app.use("/api", sameOriginWrites);
  app.use(getSession());

  // Register endpoint
  app.post("/api/register", denyRegistration);

  // Login endpoint
  app.post("/api/login", loginAttemptLimit, async (req, res) => {
    try {
      const { username, password } = req.body ?? {};

      if (typeof username !== "string" || typeof password !== "string" ||
          !username || !password || username.length > 256 || password.length > 1024) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find user
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Set session
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => err ? reject(err) : resolve());
      });
      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => err ? reject(err) : resolve());
      });
      
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
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
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const [user] = await db.select({ id: users.id }).from(users)
      .where(eq(users.id, req.session.userId)).limit(1);
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};
