import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === API ROUTES ===

  // Clients
  app.get(api.clients.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get(api.clients.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.post(api.clients.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
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

  app.put(api.clients.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
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

  // Inventory
  app.get(api.inventory.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const status = req.query.status as string;
    const items = await storage.getInventoryItems(status);
    res.json(items);
  });

  app.get(api.inventory.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const item = await storage.getInventoryItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  });

  app.post(api.inventory.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
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

  app.put(api.inventory.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
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

  app.delete(api.inventory.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteInventoryItem(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(404).json({ message: "Item not found" });
    }
  });

  // Expenses
  app.post(api.expenses.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
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

  app.delete(api.expenses.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteExpense(Number(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      res.status(404).json({ message: "Expense not found" });
    }
  });

  // Dashboard
  app.get(api.dashboard.stats.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const stats = await storage.getDashboardStats();
    res.json(stats);
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
