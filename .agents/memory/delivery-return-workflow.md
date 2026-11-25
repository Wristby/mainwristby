---
name: Delivery return workflow
description: Manual delivery confirmation and the user's watch-return accounting rules
---

The user wants to track a 14-day return-request window from customer delivery for watches sold in NL. They chose “Mark delivered manually” rather than automatic carrier lookup. Return cases are separate records; receiving or completing a case must not automatically change inventory fields or write expense corrections. The user will update the watch record manually.

For the return workflow, preserve original sale history and log each return separately. Start a case when the buyer requests a return; count it in the return rate only after the watch is received. Keep one watch record with multiple sale cycles. Record actual partial/full refund and refund date, return shipment carrier/tracking/cost/payer, inspection condition, missing items, and next action. The user says Chrono24 fees are refunded when a return is complete, so record that adjustment on the return case. Keep original outbound shipping costs even when the sale is returned. Return costs and refunds reduce realized profit; monthly return counts use the date the watch comes back, with an overall rate based on confirmed sales.

The original purchase cost (COGS) must never change because a watch is returned. Keep the original sale and its profit snapshot; show refunds and return costs as a separate adjustment. Restore the original cost only as a return credit after the watch is received, then count that same cost once on a later sale cycle without changing the inventory purchase cost.

For proceeds tracking, use the watch's current delivery date for its latest active sale cycle. When a delivery-only edit is saved, sync only that date to the latest sale-cycle snapshot; never recalculate sale financials. Keep earlier sale-cycle delivery dates historical.

**Why:** The user wants return handling isolated from inventory and the expense ledger; their manual watch edits determine current inventory status and sales reporting. Sale/return history must still preserve reconciliations independently.

**How to apply:** Return-case edits may update the linked return record and derived return-case fields only. Do not automatically change inventory status, clear sale fields, or create expense corrections. The user manually updates the watch when needed. Keep delivery dates manually confirmable and correctable; for the latest active sale cycle, sync only the delivered date and do not overwrite older cycle dates. Treat the countdown as an operational reminder, not a determination of legal eligibility.
