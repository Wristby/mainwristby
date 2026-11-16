import { useEffect, useRef } from "react";
import { Link } from "wouter";
import "./public-landing.css";

const capabilities = [
  {
    index: "01",
    title: "A watch, fully remembered.",
    copy: "Reference, condition, provenance and status stay together—from the first sourcing note to the final sale.",
    mark: "I",
  },
  {
    index: "02",
    title: "The asking price, in context.",
    copy: "Keep acquisition and service costs beside your asking price, so the shape of a deal is always in view.",
    mark: "II",
  },
  {
    index: "03",
    title: "Every client, understood.",
    copy: "Bring client notes and interests into the same context as the watches and conversations they belong to.",
    mark: "III",
  },
  {
    index: "04",
    title: "A handover that holds its history.",
    copy: "Keep delivery, sale and warranty information connected to the watch record after it leaves your hands.",
    mark: "IV",
  },
];

function Arrow() {
  return <span className="noct-arrow" aria-hidden="true">↗</span>;
}

export default function PublicLanding() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>(".noct-reveal"));
    const revealAll = () => items.forEach((item) => item.classList.add("noct-visible"));
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("noct-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13 });

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="noct-page" id="noct-top" ref={pageRef}>
      <header className="noct-header">
        <a href="#noct-top" className="noct-wordmark" aria-label="WRISTBY home">
          <span className="noct-mark">W</span><span>WRISTBY</span>
        </a>
        <nav className="noct-nav" aria-label="Main navigation">
          <a href="#noct-workspace">Workspace</a>
          <a href="#noct-details">What it holds</a>
          <a href="#noct-pricing">Pricing</a>
        </nav>
        <div className="noct-header-actions">
          <Link className="noct-signin" href="/login">Sign in</Link>
          <Link className="noct-top-cta" href="/signup">Create your workspace <Arrow /></Link>
        </div>
      </header>

      <section className="noct-hero">
        <img
          className="noct-hero-image"
          src="/images/nocturne-landing-hero.webp"
          alt="A fictional vintage steel watch, caught in a narrow shaft of amber light against deep shadow"
        />
        <div className="noct-hero-shade" />
        <div className="noct-hero-content noct-reveal">
          <div className="noct-eyebrow"><span className="noct-live-dot" /> A PRIVATE WORKSPACE FOR INDEPENDENT WATCH DEALERS</div>
          <h1>After hours,<br />every detail<br /><em>still matters.</em></h1>
          <div className="noct-hero-bottom">
            <p>From the first sourcing note to the warranty after the sale. Stock, clients and the small details behind a good deal, held in one considered place.</p>
            <Link className="noct-button noct-button-bright" href="/signup">Find your clear view <Arrow /></Link>
          </div>
        </div>
        <div className="noct-hero-meta"><span>WRISTBY / FIELD STUDY 01</span><span>THE WORK BEHIND EVERY GOOD WATCH</span></div>
        <div className="noct-hero-index"><span>01</span><i />04</div>
      </section>

      <section className="noct-manifesto" id="noct-workspace">
        <div className="noct-section-label"><span>01 — THE WORKSPACE</span><span>MADE FOR THE INDEPENDENT DEALER</span></div>
        <div className="noct-manifesto-grid noct-reveal">
          <h2>Good dealing<br />happens in the<br /><em>in-between.</em></h2>
          <div className="noct-manifesto-copy">
            <span className="noct-asterisk">✳</span>
            <p>What you paid. What it needs. Who has been looking for one. Where it is going next.</p>
            <p>WRISTBY gives the moving parts of an independent watch business a shared home—without making the work about software.</p>
            <a className="noct-underlink" href="#noct-details">A closer look <Arrow /></a>
          </div>
        </div>
        <div className="noct-manifesto-foot">
          <span><b>01</b> One record, from source to sale</span>
          <span><b>02</b> Costs beside the asking price</span>
          <span><b>03</b> The handover, still in view</span>
        </div>
      </section>

      <section className="noct-workspace">
        <div className="noct-workspace-head noct-reveal">
          <div><span className="noct-eyebrow">A CLEARER VIEW OF THE TRADE</span><h2>One quiet place<br />to keep <em>watch.</em></h2></div>
          <p>Stock, margin and client context, thoughtfully arranged in one private workspace.</p>
        </div>
        <div className="noct-dashboard noct-reveal">
          <aside className="noct-dash-rail" aria-hidden="true">
            <div className="noct-dash-logo"><span className="noct-mark">W</span> WRISTBY</div>
            <span className="noct-rail-label">YOUR WORKSPACE</span>
            <div className="noct-rail-item current"><i />Overview</div>
            <div className="noct-rail-item"><i />Inventory</div>
            <div className="noct-rail-item"><i />Clients</div>
            <div className="noct-rail-item"><i />Sales</div>
            <span className="noct-rail-label noct-rail-business">BUSINESS</span>
            <div className="noct-rail-item"><i />Analysis</div>
            <div className="noct-rail-item"><i />Settings</div>
            <div className="noct-profile"><b>AD</b><span>Alex Duval<small>Independent dealer</small></span></div>
          </aside>
          <div className="noct-dash-main">
            <div className="noct-demo-notice"><span /> FICTIONAL DEMO DATA</div>
            <div className="noct-dash-title">
              <div><span>MONDAY, 16 JUNE</span><h3>Good morning, Alex.</h3></div>
              <button type="button" className="noct-add-button" aria-label="Demo preview only">+ Add a watch</button>
            </div>
            <div className="noct-stat-grid">
              <article><span>Active watches</span><strong>08</strong><small>Across 5 brands</small><i>↗</i></article>
              <article><span>Asking value</span><strong>€84,650</strong><small>Inventory overview</small><i>◌</i></article>
              <article><span>Clients</span><strong>14</strong><small>Workspace contacts</small><i>◎</i></article>
            </div>
            <div className="noct-table-title"><b>Recent inventory</b><span>View all inventory <Arrow /></span></div>
            <div className="noct-inventory">
              <div className="noct-inventory-row noct-table-head"><span>WATCH</span><span>ACQUIRED</span><span>ASKING</span><span>STATUS</span></div>
              <div className="noct-inventory-row"><span className="noct-watch-cell"><i className="noct-watch-disc disc-one" /><span>Steel calendar<small>36mm · Fictional demo</small></span></span><span>€4,200</span><span>€5,850</span><span><b className="noct-status listed" />Listed</span></div>
              <div className="noct-inventory-row"><span className="noct-watch-cell"><i className="noct-watch-disc disc-two" /><span>Racing chronograph<small>39mm · Fictional demo</small></span></span><span>€8,900</span><span>€11,200</span><span><b className="noct-status listed" />Listed</span></div>
              <div className="noct-inventory-row"><span className="noct-watch-cell"><i className="noct-watch-disc disc-three" /><span>Gold dress watch<small>34mm · Fictional demo</small></span></span><span>€6,350</span><span>€8,100</span><span><b className="noct-status service" />In service</span></div>
            </div>
            <div className="noct-demo-foot">Illustrative workspace preview · all names, figures and inventory are fictional.</div>
          </div>
        </div>
        <div className="noct-dashboard-caption"><span>STOCK / PEOPLE / AFTERCARE</span><span>BUILT AROUND THE WAY A WATCH CHANGES HANDS</span></div>
      </section>

      <section className="noct-details" id="noct-details">
        <div className="noct-details-intro noct-reveal">
          <span className="noct-eyebrow">02 — THE DETAILS, TOGETHER</span>
          <h2>Nothing<br />left <em>behind.</em></h2>
          <p>From first note to final handover, the context travels with the watch.</p>
          <span className="noct-details-index">A DEALER&apos;S FIELD GUIDE / 01</span>
        </div>
        <div className="noct-cap-list">
          {capabilities.map((item) => (
            <article className="noct-cap noct-reveal" key={item.index}>
              <span className="noct-cap-index">{item.index}</span>
              <div><span className="noct-cap-mark">{item.mark} / THE RECORD</span><h3>{item.title}</h3><p>{item.copy}</p></div>
              <span className="noct-cap-arrow"><Arrow /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="noct-interlude">
        <div className="noct-interlude-orbit" aria-hidden="true"><span /><i /></div>
        <span className="noct-eyebrow">A QUIETER KIND OF CONTROL</span>
        <h2>Software should<br />respect the <em>craft.</em></h2>
        <p>Less time looking for the details.<br />More room to do what you do well.</p>
        <span className="noct-interlude-foot">WRISTBY / INDEPENDENT BY DESIGN</span>
      </section>

      <section className="noct-pricing" id="noct-pricing">
        <div className="noct-price-heading noct-reveal">
          <div><span className="noct-eyebrow">03 — ACCESS</span><h2>Begin in your<br /><em>own time.</em></h2></div>
          <p>Try the complete workspace for seven days. Then decide whether you want to continue.</p>
        </div>
        <div className="noct-plan-grid noct-plan-grid-trial">
          <article className="noct-plan noct-plan-pro noct-reveal">
            <div className="noct-plan-overline"><span>ONE PLAN / FULL ACCESS</span><i>7-DAY TRIAL</i></div>
            <h3>See the whole picture.</h3>
            <div className="noct-price">€0 <small>for 7 days</small></div>
            <p>Every workspace feature and AI tool, with no payment details required upfront.</p>
            <ul><li>Full access to your workspace and records</li><li>Every AI feature included</li><li>No card required and no automatic charge</li><li>Continue manually for €39.99 / month</li></ul>
            <Link className="noct-button noct-button-gold" href="/signup">Start your 7-day trial <Arrow /></Link>
          </article>
        </div>
        <p className="noct-plan-note noct-reveal">Public account creation is currently closed while hosting and privacy setup are finalized.</p>
      </section>

      <section className="noct-last-call">
        <span className="noct-last-number">WRISTBY — 04</span>
        <div className="noct-last-content noct-reveal">
          <span className="noct-eyebrow">YOUR NEXT DEAL, IN VIEW</span>
          <h2>Keep the details<br />in their <em>place.</em></h2>
          <p>A private workspace for the people and watches behind your business.</p>
          <Link href="/signup" className="noct-button noct-button-bright">Create your workspace <Arrow /></Link>
          <span className="noct-last-caption">A CLEARER PLACE TO BEGIN</span>
        </div>
      </section>

      <footer className="noct-footer">
        <a href="#noct-top" className="noct-wordmark" aria-label="WRISTBY home"><span className="noct-mark">W</span><span>WRISTBY</span></a>
        <p>Private workspace for independent watch dealers</p>
        <nav aria-label="Footer navigation">
          <a href="mailto:contact@wristby.com">Contact</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/signup">Get started <Arrow /></Link>
        </nav>
        <span className="noct-copyright">© WRISTBY</span>
      </footer>
    </main>
  );
}
