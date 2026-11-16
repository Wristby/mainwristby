# WRISTBY public launch and privacy checklist

**Status:** Draft, last reviewed 16 November 2026. This is an engineering checklist, not legal advice or a GDPR compliance certification.

## Registration stays closed

Public account creation must remain disabled until all of the following are true:

- `PUBLIC_REGISTRATION_ENABLED=true` is deliberately set on the production host.
- `PUBLIC_LEGAL_DOCUMENTS_APPROVED=true` is set only after the Privacy Notice, Terms, and required data-processing agreement have been reviewed and approved.
- The policy version is changed from its `draft-` value after approval; registration rejects draft policy versions.
- The manual account-isolation database migration is confirmed on that host.
- Production email and HTTPS configuration work.
- Stripe billing configuration and the public application URL are correct.

The registration route now requires both registration flags, a non-draft policy version, email configuration, and the tenant schema. Do not set the approval flag while any legal or provider details below remain unverified.

## Known product facts

- WRISTBY is operated under the name Wristby; privacy requests are directed to `contact@wristby.com`.
- The service is intended for independent watch dealers and stores account, watch, client, transaction, delivery, warranty, and financial records.
- Free is limited to 10 active watches and 25 clients. Pro is planned at €39.99 per month and includes AI features.
- Each workspace is isolated by account. Existing Replit development data is assigned to the existing owner account.
- Namecheap was identified by the operator as the cPanel host. The actual database, backup, and mail-server locations are not known.
- Stripe handles subscription checkout and billing. Google Gemini receives selected prompts/data when a Pro user invokes AI features. cPanel SMTP is the selected email setup but has not been verified on the live host.
- The application has no advertising or analytics tracking tools in its current code. It uses a login session cookie and a sidebar preference cookie. Stripe may use its own technologies on hosted checkout.
- The app does not directly integrate with UPS or another carrier.

## Before public signup

### Legal and privacy review

- Confirm the registered operator name, postal address, country/jurisdiction, and any applicable representative or DPO details.
- Confirm the controller/processor roles for account data and dealer-entered client records.
- Prepare and approve an Article 28 data-processing agreement and the subprocessors list.
- Confirm the lawful bases, privacy-request process, complaint details, minimum account age, policy-change process, and whether any marketing communications will be sent.
- Finalize monthly renewal, VAT treatment, cancellation timing, refunds, consumer protections, service availability, liability, termination, and governing-law terms.
- Have a qualified EU privacy/legal professional review the final public documents. No current code or draft text establishes full legal compliance.

### Hosting, processors, and security evidence

- Obtain Namecheap confirmation of the production database region, backup region, backup expiry, encryption-at-rest status, restore process, and relevant subprocessors.
- Verify the production SMTP host and the locations/retention of verification and password-recovery email.
- Review current Stripe and Google Gemini processing terms, data locations, retention settings, and applicable international-transfer safeguards.
- Document how security incidents and rights requests are handled, including user notification and vendor escalation.
- Do not claim encryption at rest, a particular region, or a backup deletion period until verified.

### Data rights and retention

- Full workspace export and account closure are not currently self-service. The draft directs requests to `contact@wristby.com`.
- Dealers should receive and respond to rights requests for personal information they entered about their own clients; Wristby should assist where it acts as a processor.
- Retention controls exist, but no complete service-wide schedule or verified backup-expiry period is published. Set and review actual periods before promising deletion timelines.
- Individual watch/client deletion does not by itself confirm removal from all backups or legally retained records.

### AI transparency

- AI is optional and invoked by the user. Depending on the feature, prompts can include watch attributes, a search question, or business/sales/cost summaries.
- The prompt text users enter may contain personal information. The interface and policy should warn users not to include client names, contact details, addresses, serials, or tracking numbers.
- Verify Google’s processing terms and data controls before enabling Pro AI for public accounts. Do not claim prompts are never retained or used for training unless confirmed for the actual API configuration.
