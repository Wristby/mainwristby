import express, { type Express, type RequestHandler } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { users } from "@shared/models/auth";
import { db } from "./db";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";

function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe billing is not configured.");
  return new Stripe(secretKey);
}

function appBaseUrl() {
  const rawUrl = process.env.PUBLIC_APP_URL;
  if (!rawUrl) throw new Error("PUBLIC_APP_URL is not configured.");
  const url = new URL(rawUrl);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("PUBLIC_APP_URL must use HTTPS.");
  }
  return url.origin;
}

async function saveSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer : subscription.customer.id;
  const userId = subscription.metadata?.userId;
  const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
  const update = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    stripeCurrentPeriodEnd: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000)
      : null,
    updatedAt: new Date(),
  };
  if (userId) {
    await db.update(users).set(update).where(eq(users.id, userId));
    return;
  }
  await db.update(users).set(update).where(eq(users.stripeCustomerId, customerId));
}

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !secret) return res.status(400).json({ message: "Invalid webhook request." });
    let event: Stripe.Event;
    try {
      event = stripeClient().webhooks.constructEvent(req.body as Buffer, signature, secret);
    } catch {
      return res.status(400).json({ message: "Invalid webhook signature." });
    }

    try {
      if (event.type.startsWith("customer.subscription.")) {
        await saveSubscription(event.data.object as Stripe.Subscription);
      } else if (event.type === "checkout.session.completed") {
        const checkout = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = typeof checkout.subscription === "string"
          ? checkout.subscription : checkout.subscription?.id;
        if (subscriptionId) {
          const subscription = await stripeClient().subscriptions.retrieve(subscriptionId);
          await saveSubscription(subscription);
        }
      }
      return res.json({ received: true });
    } catch {
      console.error("Stripe webhook processing failed.");
      return res.status(500).json({ message: "Webhook processing failed." });
    }
  });
}

export function registerBillingRoutes(app: Express) {
  const route: RequestHandler = async (req, res, next) => {
    try {
      const account = await storage.getWorkspaceAccess();
      if (req.path === "/api/billing/status") {
        res.json(account);
        return;
      }
      const userId = req.session.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const stripe = stripeClient();
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        stripeCustomerId: users.stripeCustomerId,
      }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      if (req.path === "/api/billing/checkout") {
        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) throw new Error("STRIPE_PRICE_ID is not configured.");
        if (account.plan === "pro") {
          res.status(409).json({ message: "This workspace already has Pro access." });
          return;
        }
        if (account.plan === "trial") {
          res.status(409).json({ message: "You can subscribe after your 7-day trial ends. No payment will be taken during the trial." });
          return;
        }
        const baseUrl = appBaseUrl();
        const checkout = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${baseUrl}/account?billing=success`,
          cancel_url: `${baseUrl}/account?billing=cancel`,
          client_reference_id: user.id,
          customer: user.stripeCustomerId || undefined,
          customer_email: user.stripeCustomerId ? undefined : user.email || undefined,
          metadata: { userId: user.id },
          subscription_data: { metadata: { userId: user.id } },
        });
        res.json({ url: checkout.url });
        return;
      }
      if (req.path === "/api/billing/portal") {
        if (!user.stripeCustomerId) {
          res.status(400).json({ message: "No billing account is linked yet." });
          return;
        }
        const portal = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${appBaseUrl()}/account`,
        });
        res.json({ url: portal.url });
        return;
      }
      res.status(404).json({ message: "Not found" });
    } catch {
      console.error("Billing request could not be completed.");
      res.status(503).json({ message: "Billing is not configured on this host yet." });
    }
  };

  app.get("/api/billing/status", isAuthenticated, route);
  app.post("/api/billing/checkout", isAuthenticated, route);
  app.post("/api/billing/portal", isAuthenticated, route);
}
