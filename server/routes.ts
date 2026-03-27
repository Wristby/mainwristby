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

  // Settings
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    const allSettings = await storage.getAllSettings();
    res.json(allSettings);
  });

  app.put("/api/settings/:key", isAuthenticated, async (req, res) => {
    const key = String(req.params.key);
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ message: "Value is required" });
    }
    const result = await storage.upsertSetting(key, value);
    res.json(result);
  });

  app.get("/api/ai/models", isAuthenticated, async (req, res) => {
    const apiKey = process.env.STRAICO_API_KEY;
    if (!apiKey) {
      return res.json({ models: [] });
    }
    try {
      const response = await fetch("https://api.straico.com/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      if (!response.ok) {
        return res.json({ models: [] });
      }
      const data = await response.json() as any;
      const models = data?.data || [];
      const chatModels = Array.isArray(models)
        ? models.filter((m: any) => m.name && m.model).map((m: any) => ({ name: m.name, model: m.model, pricing: m.pricing }))
        : [];
      res.json({ models: chatModels });
    } catch {
      res.json({ models: [] });
    }
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

    const aiModel = await storage.getSetting("ai_model") || "openai/gpt-4o-mini";
    const promptTemplate = await storage.getSetting("ai_prompt_template") || `You are a professional luxury watch dealer. Write a compelling 2-3 paragraph marketplace listing description for the following watch. Focus on the specifications, condition, and appeal to serious collectors. Be factual, concise, and write in first person from the seller's perspective. Do not include pricing. Suitable for platforms like Chrono24 or Marktplaats.

Brand: {{brand}}
Model: {{model}}
Reference: {{referenceNumber}}
Year: {{year}}
Condition: {{condition}}
Original Box: {{box}}
Papers/Cards: {{papers}}`;

    const prompt = promptTemplate
      .replace(/\{\{brand\}\}/g, brand)
      .replace(/\{\{model\}\}/g, model)
      .replace(/\{\{referenceNumber\}\}/g, referenceNumber || "Not specified")
      .replace(/\{\{year\}\}/g, year || "Not specified")
      .replace(/\{\{condition\}\}/g, condition || "Not specified")
      .replace(/\{\{box\}\}/g, box ? "Yes" : "No")
      .replace(/\{\{papers\}\}/g, papers ? "Yes" : "No");

    try {
      const response = await fetch("https://api.straico.com/v1/prompt/completion", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          models: [aiModel],
          message: prompt,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(502).json({ message: `Straico API error: ${errText}` });
      }

      const data = await response.json() as any;

      let description = "";
      const completions = data?.data?.completions;
      if (completions && typeof completions === "object") {
        const modelKey = Object.keys(completions)[0];
        if (modelKey) {
          description = completions[modelKey]?.completion?.choices?.[0]?.message?.content || "";
        }
      }

      if (!description) {
        return res.status(502).json({ message: "No description returned from AI." });
      }

      res.json({ description });
    } catch (err: any) {
      res.status(502).json({ message: `Failed to reach AI service: ${err.message}` });
    }
  });

  // Seed Data & Settings
  await seedDatabase();
  await seedSettings();

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

const DEFAULT_SETTINGS: Record<string, any> = {
  chrono24_commission: 6.5,
  watch_register_fee: 600,
  default_tax_rate: 36.97,
  default_margin_rate: 12.5,
  monthly_profit_goal: 200000,
  aging_threshold_days: 60,
  watch_brands: [
    "Audemars Piguet", "Bell and Ross", "Blancpain", "Breguet", "Breitling",
    "Cartier", "Girard Perregaux", "Glashutte Original", "Grand Seiko",
    "Hublot", "IWC", "Jaeger-LeCoultre", "Longines",
    "Nomos Glashutte", "Omega", "Panerai", "Patek Philippe",
    "Rolex", "Tag Heuer", "Tudor", "Ulysse Nardin",
    "Vacheron Constantin", "Zenith"
  ],
  sales_platforms: ["Chrono24", "Facebook Marketplace", "OLX", "Reddit", "Website"],
  shipping_partners: ["DHL", "FedEx", "UPS"],
  purchase_channels: ["Dealer", "Chrono24", "Reddit", "eBay", "Private Purchase", "Other"],
  expense_categories: [
    { value: "marketing", label: "Marketing" },
    { value: "rent_storage", label: "Rent/Storage" },
    { value: "subscriptions", label: "Subscriptions" },
    { value: "tools", label: "Tools" },
    { value: "insurance", label: "Insurance" },
    { value: "service", label: "Service" },
    { value: "shipping", label: "Shipping" },
    { value: "parts", label: "Parts" },
    { value: "platform_fees", label: "Platform Fees" },
    { value: "other", label: "Other" },
  ],
  ai_model: "openai/gpt-4o-mini",
  ai_prompt_template: `You are a professional luxury watch dealer. Write a compelling 2-3 paragraph marketplace listing description for the following watch. Focus on the specifications, condition, and appeal to serious collectors. Be factual, concise, and write in first person from the seller's perspective. Do not include pricing. Suitable for platforms like Chrono24 or Marktplaats.

Brand: {{brand}}
Model: {{model}}
Reference: {{referenceNumber}}
Year: {{year}}
Condition: {{condition}}
Original Box: {{box}}
Papers/Cards: {{papers}}`,
  inventory_export_columns: [
    "ID", "Brand", "Model", "Reference Number", "Serial Number", "Movement Serial",
    "Year", "Condition", "Box", "Papers", "Status", "Purchased From", "Paid With",
    "Purchase Price (EUR)", "Import Fee (EUR)", "Watch Register", "Service Fee (EUR)",
    "Polish Fee (EUR)", "Target Sell Price (EUR)", "Sale Price (EUR)", "Sold Date",
    "Platform Fees (EUR)", "Shipping Fee (EUR)", "Insurance Fee (EUR)", "Margin %",
    "Sold To", "Sold Platform", "Purchase Date", "Date Received", "Date Listed", "Hold Time (Days)",
    "Shipping Partner", "Tracking Number", "Google Drive Link", "Net Profit (EUR)", "Notes"
  ],
  financial_export_columns: [
    "Description", "Amount (EUR)", "Category", "Date", "Recurring", "Watch Reference"
  ],
  dashboard_sections: {
    kpi_cards: { visible: true, order: 0 },
    quick_actions: { visible: true, order: 1 },
    monthly_profit_goal: { visible: true, order: 2 },
    quick_estimate: { visible: true, order: 3 },
    inventory_status: { visible: true, order: 4 },
    aging_inventory: { visible: true, order: 5 },
    recent_additions: { visible: true, order: 6 },
  },
};

async function seedSettings() {
  const existing = await storage.getAllSettings();
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(key in existing)) {
      await storage.upsertSetting(key, value);
    }
  }
}
