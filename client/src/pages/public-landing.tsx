import { Link } from "wouter";
import "./public-landing.css";

export default function PublicLanding() {
  return (
    <main className="wb-site">
      <header className="wb-nav">
        <a className="wb-brand" href="#top" aria-label="WRISTBY home">
          <img src="/images/wristby-logo.png" alt="" /> WRISTBY
        </a>
        <nav className="wb-links" aria-label="Main navigation">
          <a href="#workspace">Workspace</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#pricing">Pricing</a>
          <Link href="/login">Sign in</Link>
          <Link className="wb-navcta" href="/signup">Create your workspace <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="wb-hero" id="top">
        <div className="wb-overline">A private workspace for watch dealers</div>
        <h1>Know every<br /><em>watch</em> by heart.</h1>
        <div className="wb-hero-meta">
          <p>From acquisition to aftercare, keep the details of an independent watch business in one considered place.</p>
          <Link className="wb-button" href="/signup">Make room for clarity <span aria-hidden="true">↗</span></Link>
        </div>
        <figure className="wb-hero-image">
          <img src="/images/wristby-editorial.jpg" alt="Fictional vintage steel wristwatch displayed in a quiet studio" />
          <figcaption className="wb-image-label">A considered view of the details / 01</figcaption>
        </figure>
      </section>

      <div className="wb-ticker" aria-label="Product highlights">
        <span>Stock, with its full story</span>
        <span>Costs that stay in view</span>
        <span>Every client, considered</span>
        <span>Made for independent dealers</span>
      </div>

      <section className="wb-intro">
        <span className="wb-index">01 / THE IDEA</span>
        <div>
          <h2>Good dealing is in the details.</h2>
          <p>Reference, condition, what you paid, what you ask, who it is for, where it is going. WRISTBY brings the moving parts of a watch business into focus—without turning the work into work about software.</p>
        </div>
      </section>

      <section className="wb-product" id="workspace">
        <div className="wb-section-head">
          <div><span className="wb-index">02 / YOUR WORKSPACE</span><h2>See the business.<br />Then get on with it.</h2></div>
          <p>Stock, margin and client context in one private workspace, with less hunting between handoffs.</p>
        </div>
        <div className="wb-screen" aria-label="Fictional WRISTBY dashboard preview">
          <aside className="wb-screen-side" aria-hidden="true">
            <div className="wb-screen-logo"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</div>
            <small>Workspace</small><div className="active">Overview</div><div>Inventory</div><div>Clients</div><div>Sales</div>
            <small>Business</small><div>Analysis</div><div>Settings</div>
          </aside>
          <div className="wb-screen-content">
            <div className="wb-demo">Demo data · fictional inventory</div>
            <div className="wb-dash-head"><h3>Good morning, Alex</h3><span>MONDAY, 16 JUNE</span></div>
            <div className="wb-kpis">
              <div className="wb-kpi"><small>Active watches</small><strong>08</strong><em>Across 5 brands</em></div>
              <div className="wb-kpi"><small>Asking value</small><strong>€84,650</strong><em>Inventory overview</em></div>
              <div className="wb-kpi"><small>Clients</small><strong>14</strong><em>Workspace contacts</em></div>
            </div>
            <div className="wb-stock">
              <div className="wb-stock-row head"><span>Watch</span><span>Acquired</span><span>Asking</span><span>Status</span></div>
              <div className="wb-stock-row"><b>Steel calendar · 36mm</b><span>€4,200</span><span>€5,850</span><span>Listed</span></div>
              <div className="wb-stock-row"><b>Racing chronograph · 39mm</b><span>€8,900</span><span>€11,200</span><span>Listed</span></div>
              <div className="wb-stock-row"><b>Gold dress watch · 34mm</b><span>€6,350</span><span>€8,100</span><span>Service</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="wb-capabilities" id="capabilities">
        <span className="wb-index">03 / THE PRACTICE</span>
        <h2 className="wb-cap-title">One place for the things that make a deal.</h2>
        <div className="wb-cap-grid">
          <article className="wb-cap"><span>01 — STOCK</span><h3>Inventory with a memory</h3><p>Record references, condition, provenance and status. Follow a watch from arrival through listing and sale.</p></article>
          <article className="wb-cap"><span>02 — NUMBERS</span><h3>Costs beside the ask</h3><p>Keep acquisition costs, service spend and pricing together to understand the shape of a margin.</p></article>
          <article className="wb-cap"><span>03 — PEOPLE</span><h3>Buyers, kept in context</h3><p>Keep client notes and interests close to the watches and conversations they belong to.</p></article>
          <article className="wb-cap"><span>04 — AFTER THE DEAL</span><h3>Delivery and warranty details</h3><p>Carry delivery, sale and warranty information forward, so the handover is part of the record.</p></article>
          <article className="wb-cap"><span>05 — PERSPECTIVE</span><h3>Business analysis, made useful</h3><p>Review sales and inventory information to see how the business is moving over time.</p></article>
          <article className="wb-cap"><span>06 — ASSISTANCE</span><h3>AI, when you need it</h3><p>Pro includes every AI feature. Free keeps the fundamentals close and AI unavailable.</p></article>
        </div>
      </section>

      <section className="wb-manifesto">
        <div className="wb-overline">A quieter way to stay in control</div>
        <h2>Software should respect the <em>craft</em> of the trade.</h2>
        <p>Private by design. Clear by default. Built around how independent watch dealers actually keep track.</p>
      </section>

      <section className="wb-pricing" id="pricing">
        <div className="wb-pricing-top">
          <div><span className="wb-index">04 / ACCESS</span><h2>Start with what<br />you need.</h2></div>
          <p>Keep the essentials free, or make room for your whole business as it grows.</p>
        </div>
        <div className="wb-plans">
          <article className="wb-plan">
            <span className="wb-plan-label">Free</span><div className="wb-price">€0 <small>/ month</small></div>
            <p>A thoughtful home for getting started.</p>
            <ul><li>Up to 10 active watches</li><li>Up to 25 clients</li><li>AI unavailable</li></ul>
            <Link className="wb-button" href="/signup?plan=free">Start on Free <span aria-hidden="true">↗</span></Link>
          </article>
          <article className="wb-plan pro">
            <span className="wb-plan-label">Pro / For the full picture</span><div className="wb-price">€39.99 <small>/ month</small></div>
            <p>Every record. Every tool. No ceiling.</p>
            <ul><li>Unlimited records</li><li>Every AI feature</li><li>All workspace capabilities</li></ul>
            <Link className="wb-button" href="/signup?plan=pro">Choose Pro <span aria-hidden="true">↗</span></Link>
          </article>
        </div>
      </section>

      <section className="wb-final">
        <div className="wb-overline">Keep your next deal in view</div>
        <h2>Your business, with the details in their place.</h2>
        <p>Set up a private workspace for your watch business.</p>
        <Link href="/signup" className="wb-button">Create your workspace <span aria-hidden="true">↗</span></Link>
      </section>

      <footer className="wb-footer">
        <a className="wb-brand" href="#top"><img src="/images/wristby-logo.png" alt="" /> WRISTBY</a>
        <span>Private workspace for independent watch dealers</span>
        <div><Link href="/login">Sign in</Link><Link href="/signup">Get started</Link></div>
      </footer>
    </main>
  );
}
