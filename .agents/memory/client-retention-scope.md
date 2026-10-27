---
name: Client retention scope
description: WRISTBY's need to preserve some customer records for warranties and financial recordkeeping
---
The user intends to retain some client records for warranty and financial purposes, which they understand to be required. Determine the applicable record types, legal basis, and period before building deletion or retention automation.

**Why:** The user said they need to keep a lot of personal client data for warranty information and financial reasons as required by law.

**How to apply:** Treat warranty and financial records as central retention requirements, but validate their scope and periods with appropriate Dutch legal/accounting sources. Do not infer that all optional Client contact/profile fields should be retained for the same length of time.

Retention purposes, start triggers and periods require the owner's and
accountant/legal adviser's approval. Permission to build retention safeguards is
not permission to approve a schedule or claim that the external host's backup
expiry has been verified.

**Why:** The retention work was explicitly conditioned on those approvals; no
approved legal periods or verified host backup controls were supplied.

**How to apply:** Leave periods unset until supplied, distinguish approval
attestations from independently verified sign-off, and keep external backup
verification pending until the actual hosting provider's controls are confirmed.

Current user-reported context: the live app and database are in a cPanel environment; customers are EU-based, mostly consumers; the seller offers a 12-month watch warranty; and customer shipping details are entered into UPS. The underlying hosting company, database region, and backup location are not yet confirmed.

**Why:** The user provided these business facts while requesting a WRISTBY privacy assessment.

**How to apply:** Treat the 12-month term as the seller’s stated policy, not proof that it meets every statutory consumer guarantee. Dutch consumer-law guidance says there is no single fixed statutory warranty term. Confirm the underlying cPanel host and transfer/vendor details; never assume cPanel itself is the data centre or hosting provider.

Archiving a watch must be nondestructive: hide it from active inventory while preserving its watch details, customer links, and expenses, with a way to restore it. Keep archive separate from permanent deletion.

**Why:** The user explicitly asked for archived watches to retain all other details, including customer information and expenses.

**How to apply:** Archive by marking the watch archived, not by deleting or detaching related records; keep history and client pages accurate, and retain permanent deletion as a distinct action.

For permanent deletion, remove only the record the user selected and require a confirmation. Preserve linked records; clear only foreign-key links that must be detached to delete the selected row.

**Why:** The user clarified that they want to delete selected records without deleting any linked records.

**How to apply:** This applies to watch, client, and expense deletions. Keep watches, expenses, and transaction snapshots intact when another linked record is removed, and explain any association that must be cleared.
