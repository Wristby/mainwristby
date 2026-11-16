import nodemailer from "nodemailer";

function requiredMailConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;
  const appUrl = process.env.PUBLIC_APP_URL;
  const port = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !password || !from || !appUrl || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Email service is not configured.");
  }
  const url = new URL(appUrl);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("The public app URL must use HTTPS.");
  }
  return { host, user, password, from, appUrl: url.origin, port };
}

export function isMailConfigured(): boolean {
  try {
    requiredMailConfig();
    return true;
  } catch {
    return false;
  }
}

async function sendActionLink(
  to: string,
  name: string | null | undefined,
  path: string,
  token: string,
  subject: string,
  action: string,
) {
  const config = requiredMailConfig();
  const link = new URL(path, config.appUrl);
  link.searchParams.set("token", token);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
    tls: { minVersion: "TLSv1.2" },
  });
  const greeting = name?.trim() ? `Hello ${name.trim()},` : "Hello,";
  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text: `${greeting}\n\n${action}:\n${link.toString()}\n\nIf you did not request this, you can ignore this message.`,
  });
}

export function sendVerificationEmail(to: string, name: string | null | undefined, token: string) {
  return sendActionLink(to, name, "/verify-email", token, "Verify your WRISTBY account", "Verify your email");
}

export function sendPasswordResetEmail(to: string, name: string | null | undefined, token: string) {
  return sendActionLink(to, name, "/reset-password", token, "Reset your WRISTBY password", "Choose a new password");
}
