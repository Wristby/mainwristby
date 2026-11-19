# Updating the cPanel database

The live WRISTBY database is hosted through cPanel. Database changes for that
live site are a deliberate, manual release step. The application does not run
migrations when it starts.

## Which files control what

- `migrations/*.sql` contains the incremental SQL changes.
- `migrations/cpanel-manifest.json` records their complete cPanel application
  order. The checker requires this list to match the SQL files.
- `migrations/meta/_journal.json` is Drizzle Kit metadata. It currently covers
  only part of the SQL directory; it is not the cPanel record of which changes
  have been applied. Later SQL files do not have matching Drizzle snapshots, so
  this workflow does not add them to the Drizzle journal or use Drizzle to
  update the live database.
- `database_schema.sql` is a full schema/bootstrap script, not an incremental
  upgrade history. Do not use it to update an existing cPanel database.
- `npm run db:push` and `scripts/post-merge.sh` belong to the Replit development
  workflow. They do not verify or update the live cPanel database.

The existing `0013` filename prefix is duplicated. Both files are preserved
under their existing names because the repository cannot determine whether
either has already been applied on cPanel. The checker allows only this exact
legacy pair. Do not rename or re-run either based only on its filename. The next
new incremental migration should use `0021`.

## Release checklist

1. Review the code change and identify whether it changes the database schema.
   If it does, add an incremental SQL file and add its filename to
   `migrations/cpanel-manifest.json`. Keep existing migration files unchanged.
2. Run `npm run migrations:check`. It validates repository filenames, version
   continuity, the cPanel manifest, and the Drizzle journal's references. It
   does not connect to a database or confirm production state. This check also
   runs automatically before `npm run build`; a catalog error blocks the build.
   Run `npm run test:migrations` to test the checker itself (also included in
   `npm test`). This is a file-catalog check, not a SQL syntax validator or a
   comparison of `shared/schema.ts` against either the SQL or live schema.
3. Before applying SQL, verify the actual cPanel database and determine which
   migrations are already applied. The current cPanel migration state is not
   recorded in this repository; do not assume that every file is pending or
   already applied. If the state is unclear, compare the live schema and
   existing records with the migration effects before proceeding.
4. Use the hosting provider's backup process and confirm the backup is usable.
   Apply only the confirmed pending SQL files, one at a time, in manifest order.
   Do not re-run a migration just because it is safe to repeat in development:
   some older files are not idempotent.
5. Verify the expected table/column changes and the affected app flow in the
   live environment. Record the migration filename, date, and outcome in the
   release log below.
6. Deploy the application code only after its required database changes have
   been applied and verified.

For a new database, use the documented installation procedure for that
environment. Do not treat the incremental migration list as an installation
script, and do not use `database_schema.sql` as an upgrade for an existing
database.

## cPanel release log

The current live database's applied migration state is **not verified here**.
Fill this log only after checking the cPanel database and confirming a result.

| Date | Migration file(s) | Backup reference | Result / verification |
| --- | --- | --- | --- |
