import { Link } from "wouter";
import "./public-auth.css";

const PRIVACY_EMAIL = "contact@wristby.com";

function DraftNotice() {
  return (
    <div className="wb-legal-disclaimer" role="note">
      <strong>Draft for review — not legal advice.</strong> These pages are not ready for public use. Public account creation remains disabled until the facts are verified and the documents receive appropriate legal review.
    </div>
  );
}

function PrivacyNotice() {
  return (
    <>
      <h2>1. Who operates WRISTBY</h2>
      <p>WRISTBY is operated by Wristby. For privacy requests, contact <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. The operator’s postal address, registration details, and any applicable data-protection representative details still need to be confirmed.</p>

      <h2>2. Roles and responsibility</h2>
      <p>Wristby uses account and subscription information to provide WRISTBY. Dealers decide what client, buyer, watch, warranty, delivery, and financial information they put into their workspace and why. The intended controller/processor roles for those records, and the required data-processing agreement, must be reviewed and finalized before public launch. Dealers remain responsible for having a lawful basis and giving their clients the required information.</p>

      <h2>3. Information handled</h2>
      <ul>
        <li><strong>Account:</strong> username, email, optional name, password hash, verification and recovery status, and session/security records.</li>
        <li><strong>Workspace:</strong> watch identity and serial/reference details, inventory and personal-collection records, purchase and sale amounts, expenses, pricing history, notes, warranty information, and delivery/tracking details.</li>
        <li><strong>Client and buyer records:</strong> names, email addresses, phone numbers, postal addresses, country, and watch or transaction associations entered by the account holder.</li>
        <li><strong>Subscription:</strong> plan, subscription status, and Stripe customer/subscription identifiers. Card details are submitted to Stripe’s hosted payment flow, not stored by WRISTBY.</li>
        <li><strong>Technical and security data:</strong> session identifiers and limited request/security metadata used to operate and protect the service.</li>
      </ul>

      <h2>4. Purposes and proposed legal bases</h2>
      <p>WRISTBY needs account information to create accounts, authenticate users, provide private workspaces, and deliver requested features. Subscription information supports billing. Limited security records help protect accounts and prevent abuse. The draft legal bases are contract performance, legal obligations for relevant billing records, and legitimate interests in service security; the final purposes and legal bases must be confirmed by the operator and its legal adviser.</p>
      <p>Optional AI tools run only when a user requests them. Depending on the tool, the request may include selected watch attributes, a free-text search question, or business and sales/cost summaries. Do not enter client names, contact details, addresses, serial numbers, tracking numbers, or other unnecessary personal information in AI prompts.</p>

      <h2>5. Service providers and disclosures</h2>
      <ul>
        <li><strong>Namecheap:</strong> identified by the operator as the cPanel hosting provider. It may host account and workspace data; the actual database and backup locations and security/retention settings are not yet verified.</li>
        <li><strong>Stripe:</strong> processes subscription checkout and billing. WRISTBY receives subscription identifiers and status; payment-card handling is provided by Stripe.</li>
        <li><strong>Google Gemini:</strong> receives the selected prompt or feature data when a Pro user requests an AI feature. The applicable Google processing terms, retention settings, locations, and transfer safeguards must be verified before launch.</li>
        <li><strong>cPanel SMTP:</strong> selected for account verification and password-recovery email. The live mail configuration and provider details still need verification.</li>
      </ul>
      <p>WRISTBY has no direct UPS or other carrier integration. A dealer may separately give shipping information to a carrier outside WRISTBY. The service currently has no advertising or analytics tracking tools in its application code.</p>

      <h2>6. Storage, transfers, and security</h2>
      <p>Workspace records are separated by account in the application. Implemented safeguards include password hashing, account-scoped access checks, HTTP-only and SameSite session cookies (Secure in production), login protections, and minimized request logging. The hosting region, encryption-at-rest arrangements, backup controls, and recovery procedures have not been independently verified. Provider-specific storage locations and any transfers outside the EEA, including applicable transfer safeguards, must be confirmed before this notice is published.</p>

      <h2>7. Retention and deletion</h2>
      <p>No universal retention period is stated here because the operator has not approved a complete schedule and the host’s backup expiry is unknown. Account holders can manage records in their workspace; certain financial or warranty records may need to be retained for legal reasons. Individual record deletion is available in the app, but full account export and closure are not currently self-service. For an account-data access, correction, export, or deletion request, email <a href={`mailto:${PRIVACY_EMAIL}?subject=WRISTBY%20privacy%20request`}>{PRIVACY_EMAIL}</a>. Copies in backups may remain until the provider’s verified backup expiry.</p>

      <h2>8. Your privacy rights</h2>
      <p>Depending on the applicable law and the role Wristby has for the data, you may request access, correction, deletion, restriction, or portability, object to certain processing, or withdraw consent where processing relies on consent. You may also complain to the data-protection authority in your country. For information a dealer entered about its clients, contact that dealer first; Wristby will assist the dealer where it acts as a processor. Requests can be sent to <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>; identity checks may be needed to protect the data.</p>

      <h2>9. Cookies and automated decisions</h2>
      <p>The app uses a login session cookie and a sidebar display-preference cookie. The current application code does not use advertising or analytics tracking cookies. Stripe may use its own technologies when you leave WRISTBY for hosted checkout. AI output is assistive text or search interpretation; WRISTBY does not make decisions about people with legal or similarly significant effects solely by automated processing.</p>

      <h2>10. Children, changes, and complaints</h2>
      <p>WRISTBY is intended for watch dealers and business users, not children. The minimum account age and process for policy updates still require operator approval. You can raise a privacy concern at <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> and may also complain to your local data-protection authority.</p>

      <h2>Items to confirm before publication</h2>
      <ul>
        <li>Registered operator identity, postal address, jurisdiction, and applicable representative/DPO details.</li>
        <li>Actual Namecheap data-center and backup regions, backup expiry, encryption/security controls, and the cPanel SMTP provider.</li>
        <li>Final legal bases, retention periods, account closure/export process, data-protection roles, and a reviewed data-processing agreement.</li>
        <li>Google/Stripe processor terms, international-transfer safeguards, minimum age, complaint contact process, and policy-change procedure.</li>
      </ul>
    </>
  );
}

function TermsOfService() {
  return (
    <>
      <h2>1. Operator and account eligibility</h2>
      <p>The service is provided by Wristby. Privacy requests may be sent to <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. The postal address, governing jurisdiction, minimum account age, and final support contact must be confirmed before publication. WRISTBY is intended for watch dealers and business users.</p>

      <h2>2. The service and plans</h2>
      <p>WRISTBY provides private tools for watch inventory, clients, costs, sales, delivery, warranty, and business analysis. The intended offer is a 7-day trial with full workspace and AI access. The trial starts when the account email is verified; no payment details are required to begin. At the end of the trial, access pauses unless the account holder manually subscribes. There is no automatic conversion or charge. The optional Pro subscription is intended to cost €39.99 per month. Public registration and paid billing are not live until hosting, email, Stripe, and legal setup are complete.</p>

      <h2>3. Accounts and acceptable use</h2>
      <p>Keep account details accurate, protect your password, and notify Wristby if you suspect unauthorized access. Do not access another workspace, misuse the service, upload unlawful material, or use WRISTBY to violate another person’s rights. The account holder is responsible for records entered by its users.</p>

      <h2>4. Your data and client information</h2>
      <p>You retain your rights in the information you enter. You give Wristby only the permission needed to host, secure, back up, and display that information to operate the service. You must have a lawful basis to enter personal information about clients and provide them with required privacy information. The controller/processor role split and a separate data-processing agreement still need legal review and must be in place before public onboarding of client records.</p>

      <h2>5. AI and professional advice</h2>
      <p>AI features may send the prompt and selected watch or business data to Google Gemini to return a requested result. Review AI output before relying on it. It may be incomplete or inaccurate and is not legal, tax, accounting, valuation, investment, warranty, or shipping advice. WRISTBY does not make consequential decisions for you.</p>

      <h2>6. Billing and cancellation</h2>
      <p>The intended paid offer is a recurring monthly Pro subscription of €39.99, processed through Stripe and started only when the account holder chooses to subscribe. No card is required for the 7-day trial, and the trial does not renew or charge automatically. Whether prices include VAT, when renewal is charged, how cancellation takes effect, and the refund and consumer-rights terms must be finalized before registration or checkout is enabled. WRISTBY does not store full payment-card details.</p>

      <h2>7. Service availability and intellectual property</h2>
      <p>WRISTBY is provided as a business-record tool and does not promise uninterrupted availability. WRISTBY branding, software, and design belong to Wristby or its licensors. Support levels, service availability commitments, and any applicable liability limits require final review.</p>

      <h2>8. Account closure and record retention</h2>
      <p>You may delete individual records in the app. Full account closure is not currently self-service; request it at <a href={`mailto:${PRIVACY_EMAIL}?subject=WRISTBY%20account%20closure`}>{PRIVACY_EMAIL}</a>. Some records may need to be kept for legal or financial reasons, and the timing for removal from backups has not been confirmed. The final deletion and retention process must be approved before public launch.</p>

      <h2>9. Changes and legal terms</h2>
      <p>The effective date, how material changes will be communicated, consumer-law terms, dispute process, governing law, termination rights, and liability provisions remain for operator and legal review. By creating an account, a user will be asked to accept the Terms and confirm they have read the Privacy Notice; the accepted policy versions and timestamp are recorded.</p>

      <h2>Items to confirm before publication</h2>
      <ul>
        <li>Operator’s registered identity, address, jurisdiction, eligibility/age requirement, and support process.</li>
        <li>VAT treatment, renewal and cancellation timing, refunds, consumer protections, and Stripe configuration.</li>
        <li>Final data-processing agreement, account closure process, service commitments, and legal review of liability and dispute clauses.</li>
      </ul>
    </>
  );
}

export default function LegalInfoPage() {
  const path = window.location.pathname;
  const privacy = path === "/privacy";
  return (
    <main className="wb-auth-page">
      <Link href="/landing" className="wb-auth-brand"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</Link>
      <article className="wb-auth-panel wb-legal-panel">
        <div className="wb-auth-overline">WRISTBY / {privacy ? "PRIVACY NOTICE" : "TERMS OF SERVICE"}</div>
        <h1>{privacy ? "Privacy, in progress." : "Terms, in progress."}</h1>
        <p className="wb-auth-footnote">Draft last reviewed 16 November 2026</p>
        <DraftNotice />
        {privacy ? <PrivacyNotice /> : <TermsOfService />}
        <Link className="wb-auth-back" href="/landing">← Back to WRISTBY</Link>
      </article>
      <footer className="wb-auth-footer">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href={`mailto:${PRIVACY_EMAIL}`}>Contact</a>
      </footer>
    </main>
  );
}
