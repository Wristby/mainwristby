import { useState } from "react";
import "./deal-table-landing.css";

const stages = [
  {
    name: "Sourcing",
    watch: "Steel calendar",
    reference: "FIELD NOTE / 024",
    status: "New lead",
    cost: "€3,950",
    ask: "—",
    next: "Potential seller · Lyon",
    update: "Added today · seller notes attached",
    label: "36 mm · automatic · steel",
  },
  {
    name: "Acquired",
    watch: "Steel calendar",
    reference: "RECORD / 024",
    status: "In inventory",
    cost: "€4,200",
    ask: "€5,850",
    next: "Acquisition · 12 June",
    update: "Purchase cost saved · provenance noted",
    label: "36 mm · automatic · steel",
  },
  {
    name: "In service",
    watch: "Racing chronograph",
    reference: "RECORD / 018",
    status: "Service",
    cost: "€8,900",
    ask: "€11,200",
    next: "Service check · 18 June",
    update: "Watchmaker update · awaiting estimate",
    label: "39 mm · manual · steel",
  },
  {
    name: "Listed",
    watch: "Gold dress watch",
    reference: "RECORD / 011",
    status: "Available",
    cost: "€6,350",
    ask: "€8,100",
    next: "Client interest · 16 June",
    update: "Listing live · service history attached",
    label: "34 mm · automatic · gold",
  },
  {
    name: "Handover",
    watch: "Steel calendar",
    reference: "CLOSED / 006",
    status: "Sold",
    cost: "€4,200",
    ask: "€5,650",
    next: "Warranty · through 16 June 2026",
    update: "Sale recorded · aftercare stays with the watch",
    label: "36 mm · automatic · steel",
  },
];

const facts = [
  { number: "01", title: "The whole watch record", copy: "Reference, condition, provenance and status stay together." },
  { number: "02", title: "The numbers behind it", copy: "Acquisition and service costs sit beside your asking price." },
  { number: "03", title: "The people around it", copy: "Client interests and conversations remain in context." },
];

export function DealTableLanding() {
  const [activeStage, setActiveStage] = useState(1);
  const record = stages[activeStage];

  return (
    <main className="deal-page">
      <header className="deal-topbar">
        <a className="deal-brand" href="#top" aria-label="WRISTBY home">
          <span className="deal-brand-mark">W</span><span>WRISTBY</span>
        </a>
        <nav className="deal-nav" aria-label="Main navigation">
          <a href="#workspace">The workspace</a>
          <a href="#flow">The watch record</a>
          <a href="#plans">Plans</a>
        </nav>
        <div className="deal-top-actions">
          <a className="deal-login" href="/login">Sign in</a>
          <a className="deal-primary-link" href="/signup">Create a workspace <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section className="deal-hero" id="top">
        <span className="deal-kicker deal-mono">A working view for independent watch dealers</span>
        <div className="deal-hero-grid">
          <div className="deal-intro">
            <h1>A good deal is<br />more than the <em>watch.</em></h1>
            <p className="deal-intro-copy">The cost, the conversation, the service note, the handover. WRISTBY keeps the moving parts of an independent watch business on the same page.</p>
            <div className="deal-hero-links">
              <a href="#flow">Walk through a record <span aria-hidden="true">↓</span></a>
              <a href="#plans">See plans</a>
            </div>
            <div className="deal-proofline deal-mono">
              <span><b /> Private dealer workspace</span>
              <span><b /> One record, source to sale</span>
            </div>
          </div>

          <div className="deal-demo" id="flow">
            <div className="deal-demo-head deal-mono">
              <span>WRISTBY / A WATCH THROUGH THE WORK</span>
              <span><i /> INTERACTIVE DEMO</span>
            </div>
            <div className="deal-demo-content">
              <div className="deal-steps" role="tablist" aria-label="Choose a point in the watch's journey">
                <div className="deal-steps-label deal-mono">THE RECORD / 01</div>
                {stages.map((stage, index) => (
                  <button
                    className={`deal-step${activeStage === index ? " active" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === index}
                    key={stage.name}
                    onClick={() => setActiveStage(index)}
                  >
                    <span className="deal-step-num">0{index + 1}</span>{stage.name}
                  </button>
                ))}
              </div>
              <div className="deal-record" role="tabpanel">
                <div className="deal-record-top">
                  <div><small className="deal-mono">{record.reference}</small><h2>{record.watch}</h2></div>
                  <span className="deal-status">{record.status}</span>
                </div>
                <div className="deal-watch-visual" aria-label="Illustrative watch silhouette">
                  <span className="deal-watch" aria-hidden="true" />
                  <label className="deal-mono">{record.label}</label>
                </div>
                <div className="deal-data-grid">
                  <div className="deal-data"><span>Acquired</span><strong>{record.cost}</strong></div>
                  <div className="deal-data"><span>Asking</span><strong>{record.ask}</strong></div>
                  <div className="deal-data"><span>Details</span><strong>In one place</strong></div>
                </div>
                <div className="deal-timeline"><i /><b>{record.next}</b><span>— {record.update}</span></div>
              </div>
            </div>
            <div className="deal-demo-note">Illustrative demo · all watches, names and figures are fictional.</div>
          </div>
        </div>
      </section>

      <section className="deal-context" id="workspace">
        <div className="deal-context-inner">
          <h2>From the first note<br />to the <em>next owner.</em></h2>
          <div className="deal-context-list">
            {facts.map((fact) => (
              <article className="deal-context-item" key={fact.number}>
                <b>{fact.number} / THE RECORD</b>
                <strong>{fact.title}</strong>
                <p>{fact.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="deal-plans" id="plans">
        <div className="deal-plans-head">
          <div><span className="deal-kicker deal-mono">Access / 01—02</span><h2>Start with what<br />you need.</h2></div>
          <p className="deal-plans-intro">The essentials are here when you’re starting out. Pro opens the full workspace as your business grows.</p>
        </div>
        <div className="deal-plan-table">
          <div className="deal-plan-row head deal-mono"><span>PLAN</span><span>RECORDS</span><span>MONTHLY</span><span /></div>
          <div className="deal-plan-row">
            <span className="deal-plan-name">Free</span><span>10 watches · 25 clients</span><span className="deal-plan-price">€0 <small>/ month</small></span>
            <a className="deal-plan-action" href="/signup?plan=free">Start on Free ↗</a>
          </div>
          <div className="deal-plan-row pro">
            <span className="deal-plan-name">Pro</span><span>Unlimited records · all AI features</span><span className="deal-plan-price">€39.99 <small>/ month</small></span>
            <a className="deal-plan-action" href="/signup?plan=pro">Choose Pro ↗</a>
          </div>
        </div>
        <p className="deal-closed">Public account creation is currently closed while hosting and privacy setup are finalized.</p>
      </section>

      <footer className="deal-footer">
        <a className="deal-brand" href="#top"><span className="deal-brand-mark">W</span><span>WRISTBY</span></a>
        <span>Private workspace for independent watch dealers</span>
        <nav className="deal-footer-links" aria-label="Footer navigation">
          <a href="mailto:contact@wristby.com">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Sign in</a>
        </nav>
      </footer>
    </main>
  );
}

export default DealTableLanding;
