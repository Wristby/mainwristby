---
name: Buyer contact policy
description: Optional buyer information and safe linking of sales to Client profiles
---
Named sale buyers may become Clients with whatever contact information is available. Email, phone, and country are individually optional.

**Why:** The user said, “I may not always have a phone number for example but at least a name and email in which case it should create a new client and add it to the client page.”

**How to apply:** Preserve this rule in future buyer-entry flows. Do not make missing phone, country, or email block a named buyer.

Do not silently merge people solely because their names match, overwrite an existing Client through a watch save, or bulk-create Clients from historical name-only sales.

**Why:** Names are not unique; incorrect automatic links can attribute a sale to the wrong person. Historical imports and implicit profile overwrites were outside the approved scope.

**How to apply:** Let the user explicitly select existing Clients. Detect matching contact information before creating a duplicate, while allowing different people to share a name. Keep unrelated edits to legacy sales from changing the Client directory.
