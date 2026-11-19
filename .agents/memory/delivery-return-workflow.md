---
name: Delivery return workflow
description: Manual delivery confirmation and the user's watch-return accounting rules
---

The user wants to track a 14-day return-request window from customer delivery for watches sold in NL. They chose “Mark delivered manually” rather than automatic carrier lookup.

For the return workflow, preserve original sale history and log each return separately. Start a case when the buyer requests a return; count it in the return rate only after the watch is received. On receipt, put the watch in received status for inspection. Keep one watch record with multiple sale cycles. Record actual partial/full refund and refund date, return shipment carrier/tracking/cost/payer, inspection condition, missing items, and next action. The user says Chrono24 fees are refunded when a return is complete, so remove that fee from the completed sale's costs. Keep original outbound shipping costs even when the sale is returned. Return costs and refunds reduce realized profit; monthly return counts use the date the watch comes back, with an overall rate based on confirmed sales.

The original purchase cost (COGS) must never change because a watch is returned. Keep the original sale and its profit snapshot; show refunds and return costs as a separate adjustment. Restore the original cost only as a return credit after the watch is received, then count that same cost once on a later sale cycle without changing the inventory purchase cost.

**Why:** The user needs a reliable return record without erasing sales, shipping, and profit history when the same watch is resold, and explicitly requires the original COGS to remain unchanged.

**How to apply:** Keep delivery dates manually confirmable and correctable. Treat the countdown as an operational reminder, not a determination of legal eligibility. Link return events to sale cycles so repeated sales and returns remain attributable.
