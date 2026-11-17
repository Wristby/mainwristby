---
name: Restored source and installed dependency consistency
description: Check installed validation packages against the lockfile before treating widespread errors as code regressions
---

After a workspace restore, verify the installed validation-library versions against the checked-in package files before changing schemas or form types.

**Why:** The workspace had Zod 4 and resolver 5 installed while the project declared and locked Zod 3 and resolver 3. This produced widespread type errors and changed partial-update behavior. Restoring the declared versions cleared both without a schema migration or dependency upgrade.

**How to apply:** Treat the project's dependency declarations and lockfile as authoritative for this existing application. Do not rewrite working forms to accommodate accidentally installed major versions.
