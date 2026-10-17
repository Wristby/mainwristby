---
name: Browser verification boundaries
description: Browser-testing capability and safe verification of this private business workspace
---
Do not assume the testing subagent is available merely because its skill is present. The runtime has rejected the testing configuration kind in this workspace, while local Chromium supports direct browser automation.

**Why:** Significant form behavior still needs real-browser verification, but unavailable delegation must not lead to removing authentication or provisioning unauthorized test accounts.

**How to apply:** Check available browser capabilities before retrying an unavailable agent. Browser-only API fixtures are suitable for testing navigation, validation, form state, mobile layout, and request payloads without business-data writes. Explicitly distinguish those results from authenticated live API/database verification; require authorized access for the latter.
