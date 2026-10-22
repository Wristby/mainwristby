# Client retention and backup approval

## Status and limits

No retention period or legal basis has been assumed. New installations have no
approved schedule. There is **no deletion scheduler**, including after approval.
The manual action clears optional CRM details only. Watch, financial, warranty
and expense records remain protected from deletion.

The owner and accountant/legal adviser must determine whether each identity
really needs to be retained, its lawful purpose, and the appropriate period.
The application's approval controls record the operator's attestation and
approval-document references, not independently authenticated adviser signatures.
Existing workspace accounts have equal permissions. Do not enter contact
details or sensitive case details into approval references or hold reasons.

## Categories to approve

| Category | Data | Start | Action |
| --- | --- | --- | --- |
| Optional profile | CRM name, email, phone, social handle, website, country, notes and VIP flag | Latest profile creation/update or linked purchase, receipt, sale, shipping or delivery date | Clear only after the approved period and explicit preview confirmation |
| Financial | Transaction buyer/seller identity, watch identifiers, purchase/sale amounts and dates, fees, expenses | End of the calendar year containing the sale date (purchase date if no sale) | Review only; no deletion |
| Warranty | Transaction identity, watch and delivery evidence | Recorded delivery date | Review only; no deletion |

The supported financial-year trigger assumes a calendar financial year. If the
business uses another financial year, do **not** approve this schedule until the
trigger is adapted. Missing transaction/delivery dates remain unknown, never
treated as expired. Different watch dates are evaluated separately; the preview
shows the latest date, or unknown if any linked record lacks the required date.
The seller's stated 12-month warranty is not a statutory retention period.

Keeping optional contacts for the financial period is not the default. The
financial/warranty categories do not authorise permanent retention of all client
fields. Future deletion of these records needs its own reviewed, category-aware
process; expiry dates here are review dates, not a deletion authorisation.

## Safe manual profile clearance

1. Obtain owner and accountant/legal approval for each purpose, trigger and period.
2. Verify hosting and backup controls below, then save the approved schedule.
   Editing the schedule requires renewed approval; unchecked approval saves a
   draft and immediately blocks cleanup.
3. Place any client or watch legal hold before reviewing cleanup. A watch hold
   covers its expenses and blocks clearance for linked buyers/sellers. A client
   hold covers that client's optional profile. Record a reason for placing and
   releasing holds; releases remain recorded.
4. Open the client retention preview. Review fields to clear, retained identities,
   linked watches, expenses, category dates, holds and blockers.
5. Explicitly confirm clearance. The server recalculates eligibility and rejects
   stale previews. Concurrent record writes are excluded during the transaction.
6. CRM contact details and name are cleared; the client ID and transaction links
   remain. Transaction-only identities are preserved separately without copying
   CRM contacts/notes. Existing sold-to/purchased-from text is intentionally
   retained, not silently claimed to be erased.

This is not complete personal-data erasure. Watch notes, images, attachments,
exports, UPS/shipping systems and other copies require separate review.
The audit records actions, record IDs and schedule revisions, not removed values.
Each schedule revision is also stored as append-only approval evidence so later
edits cannot replace the schedule that authorised a prior clearance.

Watch-fee edits preserve the original expense rows, amounts and dates. A change
adds a signed correction entry (including a negative reversal when a fee becomes
zero); the sum reflects the corrected fee without deleting financial history.
Fee corrections and watch changes commit together, and unchanged saves do not
append duplicate corrections.

## Backup expiry approval checklist

The cPanel hosting company's actual backup location and expiry are **unverified**.
The application cannot set, inspect, or delete those external backups. Do not
mark backups verified until the owner has evidence from the actual host covering:

- Every database/file backup, replica, provider snapshot, offsite copy, download
  and export, including locations, access controls and any transfer arrangements.
- A maximum expiry in days **after live clearance**, matching the approved
  schedule's `backup.expiryDays`. Hosts must expire every copy within this bound,
  including copies containing contact data cleared just after a backup.
- No indefinite grandfathered copies. Document exceptions/legal holds and their
  separate review/release procedure; isolate held copies from ordinary restores.
- Cleared data is not used for ordinary business from backups. Before restoring
  service, reapply profile clearances and legal holds using a protected clearance
  ledger, then confirm cleared contact data has not reappeared. Preserve the
  ledger through the full backup expiry window; it must not include cleared PII.
- Periodic expiry and restoration tests, owner accountability and approval
  evidence. Enter a concise operational procedure/evidence reference in the
  schedule, not a promise that the application enforces provider expiry.

If any host/control is unknown, save a draft with verification unchecked; manual
cleanup stays blocked. No actual backup expiry has been changed by this feature.

## Installation

Schema additions are non-destructive. Apply `migrations/0008_client_retention.sql`
to existing PostgreSQL installations, or use the project's usual `npm run db:push`
schema workflow (also used by the post-merge script). No migration deletes data,
creates approvals, or schedules cleanup. Existing profiles' update timestamp
starts at migration time, conservatively delaying first eligibility.
