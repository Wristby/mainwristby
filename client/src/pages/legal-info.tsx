import { Link } from "wouter";
import "./public-auth.css";

export default function LegalInfoPage() {
  const privacy = window.location.pathname === "/privacy";
  return (
    <main className="wb-auth-page">
      <Link href="/landing" className="wb-auth-brand"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</Link>
      <article className="wb-auth-panel wb-legal-panel">
        <div className="wb-auth-overline">WRISTBY / {privacy ? "PRIVACY NOTICE" : "TERMS OF SERVICE"}</div>
        <h1>{privacy ? "Privacy, in progress." : "Terms, in progress."}</h1>
        <p className="wb-auth-success" role="note">
          This is a working draft, not a final legal document. Public account creation remains disabled until the operator completes and reviews these terms.
        </p>
        {privacy ? (
          <>
            <h2>What the service handles</h2>
            <p>WRISTBY accounts may contain account details and business records such as watch inventory, transaction amounts, delivery and warranty information, client names, contact details and addresses. Each account is intended to have its own private workspace.</p>
            <h2>Operator and privacy contact</h2>
            <p>The service operator is Wristby. For privacy questions or requests, contact <a href="mailto:contact@wristby.com">contact@wristby.com</a>. A postal business address and a clear process for handling rights requests still need to be added before publication.</p>
            <h2>Service providers</h2>
            <p>Namecheap has been identified as the hosting provider. Stripe is used for billing, and selected Pro AI features use Google Gemini. The app is set up for cPanel SMTP for verification and account recovery. The precise database and backup locations, backup arrangements, retention periods, and live email configuration still need to be verified before this notice is published. AI features may send the information needed for a specific request to Google; do not enter unnecessary personal details into AI prompts.</p>
            <h2>Your choices and rights</h2>
            <p>Account holders should be able to access, correct, export, or request deletion of their account data, subject to records they need to retain for legal obligations. The request channel, controller identity, response process, and supervisory authority information must be completed by the operator.</p>
            <h2>Details still to complete</h2>
            <ul><li>Postal business address and confirmation of the data-protection roles for account data and customer records.</li><li>Verified database and backup locations, retention periods, and email provider.</li><li>Final processor list, international-transfer details, and rights-request procedure.</li><li>Reviewed description of account deletion and any records that must be retained.</li></ul>
          </>
        ) : (
          <>
            <h2>Operator</h2>
            <p>The service is provided by Wristby. The operator’s postal address and final support contact details must be added before these terms are published.</p>
            <h2>Account plans</h2>
            <p>The proposed plans are Free (up to 10 active watches and 25 clients; AI unavailable) and Pro (€39.99 per month; unlimited records and every AI feature). Final billing, cancellation, tax, and refund wording must be approved before public registration is enabled.</p>
            <h2>Account responsibility</h2>
            <p>Account holders are responsible for securing their login, keeping workspace information accurate, and ensuring they have a lawful basis to enter information about clients and other people.</p>
            <h2>Service limits and availability</h2>
            <p>WRISTBY is provided as a business-record tool. It does not replace accounting, legal, warranty, or shipping advice. Service availability, support, data export, suspension, termination, and liability terms still require operator review.</p>
            <h2>Details still to complete</h2>
            <ul><li>Operator’s postal address and support contact details.</li><li>Final subscription cancellation and billing terms.</li><li>Acceptable-use rules and service availability terms.</li><li>Jurisdiction, dispute, liability, and termination wording.</li></ul>
          </>
        )}
        <Link className="wb-auth-back" href="/landing">← Back to WRISTBY</Link>
      </article>
      <footer className="wb-auth-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
    </main>
  );
}
