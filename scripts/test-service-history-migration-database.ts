// Isolated PostgreSQL regression check. Uses temporary tables and rolls back.
// Supply only the disposable fixture URL documented below; never use the app DB.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { calculateWatchCostBreakdown } from "../shared/watch-financials";

const fixtureUrl =
  "postgresql://service_history_fixture@127.0.0.1:55439/service_history_migration_test";
if (
  process.env.SERVICE_HISTORY_TEST_DATABASE_URL !== fixtureUrl ||
  !process.argv.includes("--isolated")
) {
  throw new Error(
    "This test requires --isolated and SERVICE_HISTORY_TEST_DATABASE_URL set to the disposable service-history fixture database.",
  );
}

const client = new Client({ connectionString: fixtureUrl });
await client.connect();
try {
  await client.query("BEGIN");
  try {
    // Prove the conversion is independent of the database session timezone.
    await client.query("SET LOCAL TIME ZONE 'Pacific/Honolulu'");
    await client.query(`
      CREATE TEMP TABLE inventory (
        id INTEGER PRIMARY KEY,
        service_start_date TIMESTAMP,
        date_sent_to_service TIMESTAMP,
        date_returned_from_service TIMESTAMP,
        service_fee INTEGER,
        service_notes TEXT,
        purchase_price INTEGER NOT NULL,
        import_fee INTEGER DEFAULT 0,
        polish_fee INTEGER DEFAULT 0
      )
    `);
    await client.query(`
      CREATE TEMP TABLE inventory_sales (
        id INTEGER PRIMARY KEY,
        inventory_id INTEGER,
        sale_price INTEGER,
        service_fee_snapshot INTEGER,
        acquisition_cost_cents INTEGER,
        profit_at_sale_cents INTEGER
      )
    `);
    await client.query(
      `INSERT INTO inventory VALUES
        (1, '2024-03-31 23:30:00', '2024-03-29 10:00:00', '2024-10-27 23:30:00',
          12345, $1, 900000, 345, 678),
        (2, NULL, '2025-01-01 22:30:00', NULL, 0, NULL, 120000, 0, 0),
        (3, NULL, NULL, NULL, 0, NULL, 50000, 0, 0)`,
      ['Case opened: crown repaired; "water resistance" checked.'],
    );
    await client.query(`
      INSERT INTO inventory_sales VALUES (1, 1, 1450000, 12345, 913368, 510000)
    `);

    const migration = await readFile(
      new URL("../migrations/0021_inventory_service_history.sql", import.meta.url),
      "utf8",
    );
    const beforeInventory = await client.query(`
      SELECT id, purchase_price, import_fee, service_fee, polish_fee
      FROM inventory ORDER BY id
    `);
    const beforeSales = await client.query(`
      SELECT * FROM inventory_sales ORDER BY id
    `);
    const beforeCogs = calculateWatchCostBreakdown({
      purchasePrice: beforeInventory.rows[0].purchase_price,
      importFee: beforeInventory.rows[0].import_fee,
      serviceFee: beforeInventory.rows[0].service_fee,
      polishFee: beforeInventory.rows[0].polish_fee,
    }).acquisitionCostsCents;

    await client.query(migration);

    const migrated = await client.query(
      "SELECT id, service_history FROM inventory ORDER BY id",
    );
    assert.deepEqual(migrated.rows, [
      {
        id: 1,
        service_history: [{
          startDate: "2024-04-01",
          completedDate: "2024-10-28",
          costCents: 12345,
          notes: 'Case opened: crown repaired; "water resistance" checked.',
        }],
      },
      {
        id: 2,
        service_history: [{
          startDate: "2025-01-01",
          completedDate: null,
          costCents: 0,
          notes: "",
        }],
      },
      { id: 3, service_history: [] },
    ]);

    const afterInventory = await client.query(`
      SELECT id, purchase_price, import_fee, service_fee, polish_fee
      FROM inventory ORDER BY id
    `);
    const afterSales = await client.query(`
      SELECT * FROM inventory_sales ORDER BY id
    `);
    assert.deepEqual(afterInventory.rows, beforeInventory.rows);
    assert.deepEqual(afterSales.rows, beforeSales.rows);
    assert.equal(
      calculateWatchCostBreakdown({
        purchasePrice: afterInventory.rows[0].purchase_price,
        importFee: afterInventory.rows[0].import_fee,
        serviceFee: afterInventory.rows[0].service_fee,
        polishFee: afterInventory.rows[0].polish_fee,
      }).acquisitionCostsCents,
      beforeCogs,
    );
    assert.equal(beforeCogs, 913368);

    await client.query("ROLLBACK");
    console.log(
      "PASS: PostgreSQL migration preserves legacy service dates, cents and notes, handles Amsterdam DST dates, and leaves acquisition costs and sale snapshots unchanged. Fixtures were rolled back.",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
} finally {
  await client.end();
}
