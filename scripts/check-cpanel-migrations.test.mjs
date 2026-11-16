import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateMigrationCatalog } from "./check-cpanel-migrations.mjs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("migrations/cpanel-manifest.json", root), "utf8"));
const journal = JSON.parse(await readFile(new URL("migrations/meta/_journal.json", root), "utf8"));
const actualFiles = (await readdir(new URL("migrations/", root))).filter((file) => file.endsWith(".sql"));
const nextVersion = Math.max(...actualFiles.map((file) => Number(file.slice(0, 4)))) + 1;
const nextFile = `${String(nextVersion).padStart(4, "0")}_new_feature.sql`;

function catalog() {
  return structuredClone({ manifest, journal, actualFiles });
}

test("all existing files, including both historical 0013 migrations, are catalogued", () => {
  const result = validateMigrationCatalog(catalog());
  assert.deepEqual(result.errors, []);
  assert.equal(result.fileCount, actualFiles.length);
  assert.equal(result.journalCount, journal.entries.length);
  assert.ok(manifest.files.includes("0013_chrono24_certification_sent.sql"));
  assert.ok(manifest.files.includes("0013_dealer_notebook_inventory_snapshot.sql"));
});

test("an unlisted SQL file blocks the release check", () => {
  const input = catalog();
  input.actualFiles.push(nextFile);
  assert.match(validateMigrationCatalog(input).errors.join("\n"), /missing from the cPanel manifest/);
});

test("a manifest entry without SQL blocks the release check", () => {
  const input = catalog();
  input.manifest.files.push(nextFile);
  assert.match(validateMigrationCatalog(input).errors.join("\n"), /no SQL file/);
});

test("a properly listed next migration is accepted", () => {
  const input = catalog();
  input.manifest.files.push(nextFile);
  input.actualFiles.push(nextFile);
  assert.deepEqual(validateMigrationCatalog(input).errors, []);
});

test("new duplicate version numbers and a third legacy duplicate are rejected", () => {
  for (const file of ["0018_another_change.sql", "0013_another_change.sql"]) {
    const input = catalog();
    input.manifest.files.push(file);
    input.manifest.files.sort();
    input.actualFiles.push(file);
    assert.match(validateMigrationCatalog(input).errors.join("\n"), /Unexpected duplicate migration prefix/);
  }
});

test("skipped sequence numbers and malformed filenames are rejected", () => {
  for (const [file, expected] of [
    [`${String(nextVersion + 1).padStart(4, "0")}_skips_next.sql`, new RegExp(`sequence is missing ${String(nextVersion).padStart(4, "0")}`)],
    ["bad_filename.sql", /does not follow/],
  ]) {
    const input = catalog();
    input.manifest.files.push(file);
    input.actualFiles.push(file);
    assert.match(validateMigrationCatalog(input).errors.join("\n"), expected);
  }
});

test("duplicate or out-of-order manifest entries are rejected", () => {
  const duplicate = catalog();
  duplicate.manifest.files.push(duplicate.manifest.files[0]);
  assert.match(validateMigrationCatalog(duplicate).errors.join("\n"), /duplicate filenames/);
  const unordered = catalog();
  unordered.manifest.files.reverse();
  assert.match(validateMigrationCatalog(unordered).errors.join("\n"), /filename order/);
});

test("renaming or deleting either historical 0013 migration is rejected", () => {
  const input = catalog();
  input.actualFiles = input.actualFiles.filter((file) => file !== "0013_chrono24_certification_sent.sql");
  input.manifest.files = input.manifest.files.filter((file) => file !== "0013_chrono24_certification_sent.sql");
  assert.match(validateMigrationCatalog(input).errors.join("\n"), /do not rename or remove/);
});

test("missing, invalid, or reordered Drizzle journal entries are rejected", () => {
  const missing = catalog();
  missing.journal.entries[0].tag = "0000_missing";
  assert.match(validateMigrationCatalog(missing).errors.join("\n"), /references a missing SQL file/);
  const unordered = catalog();
  unordered.journal.entries.reverse();
  assert.match(validateMigrationCatalog(unordered).errors.join("\n"), /missing or out of order/);
  const invalid = catalog();
  invalid.journal = null;
  assert.match(validateMigrationCatalog(invalid).errors.join("\n"), /must describe PostgreSQL/);
});

test("the CLI runs without database credentials and explicitly reports its limits", () => {
  const result = spawnSync(process.execPath, ["scripts/check-cpanel-migrations.mjs"], {
    cwd: fileURLToPath(root),
    env: { PATH: process.env.PATH },
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /does not connect to or determine the migration state/);
});
