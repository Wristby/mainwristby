---
name: Buyer contact policy
description: Optional buyer information and safe linking of sales to Client profiles
---
Named sale buyers may become Clients with whatever contact information is available. Email, phone, and country are individually optional.

**Why:** The user said, “I may not always have a phone number for example but at least a name and email in which case it should create a new client and add it to the client page.”

**How to apply:** Preserve this rule in future buyer-entry flows. Do not make missing phone, country, or email block a named buyer.

Do not silently merge people solely because their names match or overwrite an existing Client through a watch save. Historical buyer names may now be backfilled, but possible matches to existing Clients or repeated unlinked buyer names require review before linking or creating a separate Client.

**Why:** Names are not unique; incorrect automatic links can attribute a sale to the wrong person. The user explicitly requested historical buyer backfill and chose “Review possible matches before linking.” Implicit profile overwrites remain outside the approved scope.

**How to apply:** Let the user explicitly select existing Clients. Detect matching contact information before creating a duplicate, while allowing different people to share a name. Backfill only unlinked historical buyers; never infer missing contact details from notes or restore details cleared by retention.
