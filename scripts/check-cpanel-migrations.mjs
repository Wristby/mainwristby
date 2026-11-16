import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = join(projectRoot, "migrations");
const manifestPath = join(migrationsDirectory, "cpanel-manifest.json");
const journalPath = join(migrationsDirectory, "meta", "_journal.json");

const knownLegacyDuplicate = {
  prefix: "0013",
  files: [
    "0013_chrono24_certification_sent.sql",
    "0013_dealer_notebook_inventory_snapshot.sql",
  ],
};

export function validateMigrationCatalog({ manifest, journal, actualFiles }) {
  const errors = [];
  actualFiles = [...actualFiles].sort();

  if (manifest?.formatVersion !== 1 || !Array.isArray(manifest?.files)) {
    errors.push("The cPanel migration manifest has an unsupported format.");
  }

  const manifestFiles = Array.isArray(manifest?.files) ? manifest.files : [];
  if (new Set(manifestFiles).size !== manifestFiles.length) {
    errors.push("The cPanel manifest contains duplicate filenames.");
  }
  if (JSON.stringify(manifestFiles) !== JSON.stringify([...manifestFiles].sort())) {
    errors.push("Manifest files must be listed in filename order.");
  }

  const missingFromManifest = actualFiles.filter((file) => !manifestFiles.includes(file));
  const missingFromDirectory = manifestFiles.filter((file) => !actualFiles.includes(file));
  if (missingFromManifest.length) {
    errors.push(`SQL files missing from the cPanel manifest: ${missingFromManifest.join(", ")}`);
  }
  if (missingFromDirectory.length) {
    errors.push(`Manifest entries with no SQL file: ${missingFromDirectory.join(", ")}`);
  }

  const prefixGroups = new Map();
  for (const file of actualFiles) {
    const match = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(file);
    if (!match) {
      errors.push(`Migration filename does not follow NNNN_description.sql: ${file}`);
      continue;
    }
    const files = prefixGroups.get(match[1]) ?? [];
    files.push(file);
    prefixGroups.set(match[1], files);
  }

  for (const [prefix, files] of prefixGroups) {
    if (files.length > 1) {
      const isKnownDuplicate =
        prefix === knownLegacyDuplicate.prefix &&
        JSON.stringify(files) === JSON.stringify(knownLegacyDuplicate.files);
      if (!isKnownDuplicate) {
        errors.push(`Unexpected duplicate migration prefix ${prefix}: ${files.join(", ")}`);
      }
    }
  }

  for (const file of knownLegacyDuplicate.files) {
    if (!actualFiles.includes(file) || !manifestFiles.includes(file)) {
      errors.push(`Preserve the existing ${knownLegacyDuplicate.prefix} migration pair; do not rename or remove it.`);
    }
  }

  const numericVersions = [...prefixGroups.keys()].map(Number).sort((a, b) => a - b);
  if (numericVersions.length) {
    for (let version = 0; version <= numericVersions.at(-1); version += 1) {
      if (!prefixGroups.has(String(version).padStart(4, "0"))) {
        errors.push(`Migration sequence is missing ${String(version).padStart(4, "0")}.`);
      }
    }
  }

  if (journal?.dialect !== "postgresql" || !Array.isArray(journal?.entries)) {
    errors.push("The Drizzle journal must describe PostgreSQL migrations and contain entries.");
  }
  const journalEntries = Array.isArray(journal?.entries) ? journal.entries : [];
  const journalFiles = [];
  for (const [index, entry] of journalEntries.entries()) {
    if (entry?.idx !== index) {
      errors.push(`Drizzle journal index ${index} is missing or out of order.`);
    }
    if (typeof entry?.tag !== "string") {
      errors.push(`Drizzle journal entry ${index} has no migration tag.`);
      continue;
    }
    const file = `${entry.tag}.sql`;
    if (!actualFiles.includes(file)) {
      errors.push(`Drizzle journal references a missing SQL file: ${file}`);
    }
    journalFiles.push(file);
  }

  const orderedJournalFiles = actualFiles.filter((file) => journalFiles.includes(file));
  if (JSON.stringify(journalFiles) !== JSON.stringify(orderedJournalFiles)) {
    errors.push("Drizzle journal entries do not follow the corresponding SQL filename order.");
  }

  return { errors, fileCount: actualFiles.length, journalCount: journalEntries.length };
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const journal = JSON.parse(await readFile(journalPath, "utf8"));
  const actualFiles = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql"));
  const { errors, fileCount, journalCount } = validateMigrationCatalog({ manifest, journal, actualFiles });
  if (errors.length) {
    console.error("cPanel migration check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `PASS: ${fileCount} SQL migrations match the cPanel manifest and form a continuous sequence.`,
    );
    console.log(
      `INFO: The Drizzle journal covers ${journalCount} SQL files; the cPanel manifest is the complete manual release order.`,
    );
    console.log(
      "INFO: This repository check does not connect to or determine the migration state of the live cPanel database.",
    );
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(() => {
    console.error("cPanel migration check failed: could not read or parse the manifest, SQL directory, or journal.");
    process.exitCode = 1;
  });
}
