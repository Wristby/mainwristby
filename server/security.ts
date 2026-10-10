import { createHash } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { pool } from "./db";

// This internal application intentionally has no public account provisioning.
export const denyRegistration: RequestHandler = (_req, res) => {
  res.status(403).json({ message: "Public registration is disabled." });
};

export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
};

export const sameOriginWrites: RequestHandler = (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("origin");
    if (req.get("sec-fetch-site") === "cross-site" ||
        (origin && origin !== `${req.protocol}://${req.get("host")}`)) {
      res.status(403).json({ message: "Cross-site requests are not allowed." });
      return;
    }
  }
  next();
};

export const requestMetadataLogger = (
  log: (message: string) => void,
): RequestHandler => (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api/")) {
      // Never include body, query strings, headers, cookies or user-provided IDs.
      const route = req.route?.path;
      const label = typeof route === "string" ? route : "/api/(unmatched)";
      log(`${req.method} ${label} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
};

export const safeErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const candidate = Number(err?.status || err?.statusCode);
  const status = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599
    ? candidate : 500;
  // Do not log arbitrary error objects: driver/provider errors may embed secrets.
  console.error(`Request failed (HTTP ${status}).`);
  res.status(status).json({
    message: status === 413 ? "Request too large."
      : status < 500 ? "Invalid request." : "Internal server error.",
  });
};

export async function initializeLoginProtection() {
  // Database-backed counters survive restarts and are shared by app instances.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      key text PRIMARY KEY,
      attempts integer NOT NULL,
      expires_at timestamptz NOT NULL
    )
  `);
  await pool.query("CREATE INDEX IF NOT EXISTS login_attempts_expiry_idx ON login_attempts (expires_at)");
}

export const loginAttemptLimit: RequestHandler = async (req, res, next) => {
  try {
    const username = typeof req.body?.username === "string"
      ? req.body.username.toLowerCase() : "(invalid)";
    const keys = [`ip:${req.ip || req.socket.remoteAddress || "unknown"}`, `account:${username}`]
      .map((value) => createHash("sha256").update(value).digest("hex"));
    await pool.query("DELETE FROM login_attempts WHERE expires_at <= NOW()");
    const { rows } = await pool.query<{ key: string; attempts: number; retry_after: number }>(`
      INSERT INTO login_attempts (key, attempts, expires_at)
      SELECT key, 1, NOW() + INTERVAL '15 minutes' FROM unnest($1::text[]) AS key ORDER BY key
      ON CONFLICT (key) DO UPDATE SET
        attempts = CASE WHEN login_attempts.expires_at <= NOW() THEN 1
          ELSE login_attempts.attempts + 1 END,
        expires_at = CASE WHEN login_attempts.expires_at <= NOW()
          THEN NOW() + INTERVAL '15 minutes' ELSE login_attempts.expires_at END
      RETURNING key, attempts,
        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (expires_at - NOW()))))::integer AS retry_after
    `, [keys]);
    const blocked = rows.filter((row) => row.attempts > (row.key === keys[0] ? 10 : 30));
    if (blocked.length) {
      res.setHeader("Retry-After", String(Math.max(...blocked.map((row) => row.retry_after))));
      res.status(429).json({ message: "Too many login attempts. Please try again later." });
      return;
    }
    next();
  } catch {
    // Database failure must not silently disable login protection.
    console.error("Login protection unavailable.");
    res.status(503).json({ message: "Login is temporarily unavailable. Please try again later." });
  }
};
