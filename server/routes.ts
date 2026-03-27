import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);

  // === API ROUTES ===

  // Clients
  app.get(api.clients.list.path, isAuthenticated, async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get(api.clients.get.path, isAuthenticated, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.post(api.clients.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.clients.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.clients.update.input.parse(req.body);
      const client = await storage.updateClient(Number(req.params.id), input);
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Client not found" });
    }
  });

  app.delete(api.clients.delete.path, isAuthenticated, async (req, res) => {
    try {
      await storage.deleteClient(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(404).json({ message: "Client not found" });
    }
  });

  // Inventory
  app.get(api.inventory.list.path, isAuthenticated, async (req, res) => {
    const status = req.query.status as string;
    const items = await storage.getInventoryItems(status);
    res.json(items);
  });

  app.get(api.inventory.get.path, isAuthenticated, async (req, res) => {
    const item = await storage.getInventoryItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  });

  app.post(api.inventory.create.path, isAuthenticated, async (req, res) => {
    try {
      // Coerce numeric fields from strings if necessary (though zod schema should handle types if frontend sends JSON)
      const input = api.inventory.create.input.parse(req.body);
      const item = await storage.createInventoryItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.inventory.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.inventory.update.input.parse(req.body);
      const item = await storage.updateInventoryItem(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Item not found" });
    }
  });

  app.delete(api.inventory.delete.path, isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInventoryItem(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(404).json({ message: "Item not found" });
    }
  });

  // Expenses
  app.get(api.expenses.list.path, isAuthenticated, async (req, res) => {
    const expenses = await storage.getExpenses();
    res.json(expenses);
  });

  app.post(api.expenses.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense(input);
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.expenses.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.expenses.update.input.parse(req.body);
      const expense = await storage.updateExpense(Number(req.params.id), input);
      res.json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Expense not found" });
    }
  });

  app.delete(api.expenses.delete.path, isAuthenticated, async (req, res) => {
    try {
      await storage.deleteExpense(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(404).json({ message: "Expense not found" });
    }
  });

  // Dashboard
  app.get(api.dashboard.stats.path, isAuthenticated, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // AI — Generate Listing Description
  app.post("/api/ai/generate-description", isAuthenticated, async (req, res) => {
    const apiKey = process.env.STRAICO_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "AI generation is not configured. Please add your STRAICO_API_KEY." });
    }

    const { brand, model, referenceNumber, year, condition, box, papers } = req.body;
    if (!brand || !model) {
      return res.status(400).json({ message: "Brand and model are required." });
    }

    const prompt = `You are a professional luxury watch dealer. Write a compelling 2-3 paragraph marketplace listing description for the following watch. Focus on the specifications, condition, and appeal to serious collectors. Be factual, concise, and write in first person from the seller's perspective. Do not include pricing. Suitable for platforms like Chrono24 or Marktplaats.

Brand: ${brand}
Model: ${model}
Reference: ${referenceNumber || "Not specified"}
Year: ${year || "Not specified"}
Condition: ${condition || "Not specified"}
Original Box: ${box ? "Yes" : "No"}
Papers/Cards: ${papers ? "Yes" : "No"}`;

    try {
      const response = await fetch("https://api.straico.com/v1/prompt/completion", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          models: ["openai/gpt-4o-mini"],
          message: prompt,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(502).json({ message: `Straico API error: ${errText}` });
      }

      const data = await response.json() as any;
      const description = data?.data?.completion?.choices?.[0]?.message?.content
        ?? data?.data?.completions?.[0]?.completion?.choices?.[0]?.message?.content
        ?? "";

      if (!description) {
        return res.status(502).json({ message: "No description returned from AI." });
      }

      res.json({ description });
    } catch (err: any) {
      res.status(502).json({ message: `Failed to reach AI service: ${err.message}` });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingClients = await storage.getClients();
  if (existingClients.length === 0) {
    const dealer = await storage.createClient({
      name: "Luxury Watch Supply Co.",
      email: "dealer@supply.co",
      type: "dealer",
      notes: "Trusted supplier for Rolex/Patek."
    });
    
    const client = await storage.createClient({
      name: "John Smith",
      email: "john@example.com",
      type: "client",
      notes: "VIP Collector. Likes vintage Omega."
    });

    // Rolex Submariner (In Stock)
    await storage.createInventoryItem({
      brand: "Rolex",
      model: "Submariner",
      referenceNumber: "124060",
      purchasePrice: 900000, // $9,000.00
      targetSellPrice: 1150000, // $11,500.00
      purchaseDate: new Date("2025-01-10"),
      condition: "New",
      status: "in_stock",
      box: true,
      papers: true,
      clientId: dealer.id,
      notes: "Full set, stickers on."
    });

    // Patek Nautilus (Sold)
    await storage.createInventoryItem({
      brand: "Patek Philippe",
      model: "Nautilus",
      referenceNumber: "5711/1A",
      purchasePrice: 9000000, // $90,000.00
      targetSellPrice: 11500000, 
      soldPrice: 11000000, // $110,000.00
      purchaseDate: new Date("2024-11-01"),
      soldDate: new Date("2024-12-15"),
      condition: "Mint",
      status: "sold",
      box: true,
      papers: true,
      clientId: dealer.id,
      buyerId: client.id,
      notes: "Quick flip."
    });

    // Omega Speedmaster (Servicing)
    await storage.createInventoryItem({
      brand: "Omega",
      model: "Speedmaster Professional",
      referenceNumber: "311.30.42.30.01.005",
      purchasePrice: 400000, // $4,000.00
      targetSellPrice: 550000, // $5,500.00
      purchaseDate: new Date("2025-01-20"),
      condition: "Used",
      status: "servicing",
      box: true,
      papers: false,
      clientId: client.id,
      notes: "Needs movement service."
    });
  }
}
