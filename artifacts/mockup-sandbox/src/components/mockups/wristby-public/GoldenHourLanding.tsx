import { useEffect } from "react";
import "./golden-hour-landing.css";

const capabilities = [
  {
    number: "01",
    roman: "I",
    title: "A watch, fully remembered.",
    copy: "Reference, condition, provenance and status stay together—from the first sourcing note to the final sale.",
  },
  {
    number: "02",
    roman: "II",
    title: "The asking price, in context.",
    copy: "Keep acquisition and service costs beside your asking price, so the shape of a deal is always in view.",
  },
  {
    number: "03",
    roman: "III",
    title: "Every client, understood.",
    copy: "Bring client notes and interests into the same context as the watches and conversations they belong to.",
  },
  {
    number: "04",
    roman: "IV",
    title: "A handover that holds its history.",
    copy: "Keep delivery, sale and warranty information connected to the watch record after it leaves your hands.",
  },
];

function Arrow() {
  return <span className="gh-arrow" aria-hidden="true">↗</span>;
}

export function GoldenHourLanding() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".gh-reveal"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("gh-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("gh-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="gh-page" id="gh-top">
      <header className="gh-header">
        <a href="#gh-top" className="gh-brand" aria-label="WRISTBY home">
          <span className="gh-brand-mark">W</span><span>WRISTBY</span>
        </a>
        <nav className="gh-nav" aria-label="Main navigation">
          <a href="#gh-workspace">Workspace</a>
          <a href="#gh-details">What it holds</a>
          <a href="#gh-pricing">Pricing</a>
        </nav>
        <div className="gh-header-ctas">
          <a className="gh-signin" href="/login">Sign in</a>
          <a className="gh-header-cta" href="/signup">Create your workspace <Arrow /></a>
        </div>
      </header>

      <section className="gh-hero">
        <img className="gh-hero-image" src="/__mockup/images/golden-hour-landing-hero.png" alt="A fictional vintage steel watch resting in the last warm light of the afternoon" />
        <div className="gh-image-wash" />
        <div className="gh-hero-copy gh-reveal">
          <div className="gh-kicker"><span className="gh-sun-mark" /> A PRIVATE WORKSPACE FOR INDEPENDENT WATCH DEALERS</div>
          <h1>Good work<br />holds its <em>glow.</em></h1>
          <div className="gh-hero-bottom">
            <p>From the first sourcing note to the warranty after the sale. Stock, clients and the small details behind a good deal, held in one considered place.</p>
            <a className="gh-button gh-button-dark" href="/signup">Find your clear view <Arrow /></a>
          </div>
        </div>
        <div className="gh-hero-stamp"><span>WRISTBY / FIELD NOTES</span><i /> <span>INDEPENDENT BY DESIGN</span></div>
        <div className="gh-hero-number">01 <b>—</b> 04</div>
      </section>

      <section className="gh-manifesto" id="gh-workspace">
        <div className="gh-section-rule"><span>01 — THE WORKSPACE</span><span>MADE FOR THE INDEPENDENT DEALER</span></div>
        <div className="gh-manifesto-grid gh-reveal">
          <h2>Good dealing<br />happens in the<br /><em>in-between.</em></h2>
          <div className="gh-manifesto-copy">
            <span className="gh-sunburst" aria-hidden="true">✳</span>
            <p>What you paid. What it needs. Who has been looking for one. Where it is going next.</p>
            <p>WRISTBY gives the moving parts of an independent watch business a shared home—without making the work about software.</p>
            <a className="gh-text-link" href="#gh-details">A closer look <Arrow /></a>
          </div>
        </div>
        <div className="gh-manifesto-foot">
          <span><b>01</b> One record, from source to sale</span>
          <span><b>02</b> Costs beside the asking price</span>
          <span><b>03</b> The handover, still in view</span>
        </div>
      </section>

      <section className="gh-workspace">
        <div className="gh-workspace-heading gh-reveal">
          <div><span className="gh-kicker">A CLEARER VIEW OF THE TRADE</span><h2>One quiet place<br />to keep <em>watch.</em></h2></div>
          <p>Stock, margin and client context, thoughtfully arranged in one private workspace.</p>
        </div>
        <div className="gh-dashboard gh-reveal">
          <aside className="gh-sidebar">
            <div className="gh-dash-brand"><span className="gh-brand-mark">W</span> WRISTBY</div>
            <span className="gh-side-label">YOUR WORKSPACE</span>
            <div className="gh-side-item is-active"><i />Overview</div>
            <div className="gh-side-item"><i />Inventory</div>
            <div className="gh-side-item"><i />Clients</div>
            <div className="gh-side-item"><i />Sales</div>
            <span className="gh-side-label gh-side-business">BUSINESS</span>
            <div className="gh-side-item"><i />Analysis</div>
            <div className="gh-side-item"><i />Settings</div>
            <div className="gh-profile"><b>AD</b><span>Alex Duval<small>Independent dealer</small></span></div>
          </aside>
          <div className="gh-dash-content">
            <div className="gh-demo-label"><i /> FICTIONAL DEMO DATA</div>
            <div className="gh-dashboard-title">
              <div><span>MONDAY, 16 JUNE</span><h3>Good morning, Alex.</h3></div>
              <button type="button" className="gh-add-button" disabled title="Illustrative preview only">+ Add a watch</button>
            </div>
            <div className="gh-stats">
              <article><span>Active watches</span><strong>08</strong><small>Across 5 brands</small><i>↗</i></article>
              <article><span>Asking value</span><strong>€84,650</strong><small>Inventory overview</small><i>◌</i></article>
              <article><span>Clients</span><strong>14</strong><small>Workspace contacts</small><i>◎</i></article>
            </div>
            <div className="gh-table-title"><b>Recent inventory</b><span>View all inventory <Arrow /></span></div>
            <div className="gh-inventory">
              <div className="gh-inventory-row gh-table-head"><span>WATCH</span><span>ACQUIRED</span><span>ASKING</span><span>STATUS</span></div>
              <div className="gh-inventory-row"><span className="gh-watch-cell"><i className="gh-watch-disc gh-disc-one" /><span>Steel calendar<small>36mm · Fictional demo</small></span></span><span>€4,200</span><span>€5,850</span><span><b className="gh-status gh-listed" />Listed</span></div>
              <div className="gh-inventory-row"><span className="gh-watch-cell"><i className="gh-watch-disc gh-disc-two" /><span>Racing chronograph<small>39mm · Fictional demo</small></span></span><span>€8,900</span><span>€11,200</span><span><b className="gh-status gh-listed" />Listed</span></div>
              <div className="gh-inventory-row"><span className="gh-watch-cell"><i className="gh-watch-disc gh-disc-three" /><span>Gold dress watch<small>34mm · Fictional demo</small></span></span><span>€6,350</span><span>€8,100</span><span><b className="gh-status gh-service" />In service</span></div>
            </div>
            <div className="gh-demo-foot">Illustrative workspace preview · all names, figures and inventory are fictional.</div>
          </div>
        </div>
        <div className="gh-dashboard-caption"><span>STOCK / PEOPLE / AFTERCARE</span><span>BUILT AROUND THE WAY A WATCH CHANGES HANDS</span></div>
      </section>

      <section className="gh-details" id="gh-details">
        <div className="gh-details-intro gh-reveal">
          <span className="gh-kicker">02 — THE DETAILS, TOGETHER</span>
          <h2>Nothing<br />left <em>behind.</em></h2>
          <p>From first note to final handover, the context travels with the watch.</p>
          <span className="gh-details-note">A DEALER'S FIELD GUIDE / 2025</span>
        </div>
        <div className="gh-capabilities">
          {capabilities.map((item) => (
            <article className="gh-capability gh-reveal" key={item.number}>
              <span className="gh-cap-number">{item.number}</span>
              <div><span className="gh-cap-overline">{item.roman} / THE RECORD</span><h3>{item.title}</h3><p>{item.copy}</p></div>
              <span className="gh-cap-arrow"><Arrow /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="gh-interlude">
        <div className="gh-orbit" aria-hidden="true"><span /><i /><b /></div>
        <span className="gh-kicker">A QUIETER KIND OF CONTROL</span>
        <h2>Software should<br />respect the <em>craft.</em></h2>
        <p>Less time looking for the details.<br />More room to do what you do well.</p>
        <span className="gh-interlude-foot">WRISTBY / INDEPENDENT BY DESIGN</span>
      </section>

      <section className="gh-pricing" id="gh-pricing">
        <div className="gh-price-heading gh-reveal">
          <div><span className="gh-kicker">03 — ACCESS</span><h2>Begin in your<br /><em>own time.</em></h2></div>
          <p>The fundamentals are here when you’re starting out. Pro opens the full workspace as your business grows.</p>
        </div>
        <div className="gh-plan-grid">
          <article className="gh-plan gh-reveal">
            <div className="gh-plan-overline"><span>01 / THE ESSENTIALS</span><i>FREE</i></div>
            <h3>Free</h3>
            <div className="gh-price">€0 <small>/ month</small></div>
            <p>Keep the essentials in order, at your own pace.</p>
            <ul><li>Up to 10 active watches</li><li>Up to 25 clients</li><li>AI features unavailable</li></ul>
            <a className="gh-button gh-button-outline" href="/signup?plan=free">Start on Free <Arrow /></a>
          </article>
          <article className="gh-plan gh-plan-pro gh-reveal">
            <div className="gh-plan-overline"><span>02 / THE FULL PICTURE</span><i>PRO</i></div>
            <h3>Pro</h3>
            <div className="gh-price">€39.99 <small>/ month</small></div>
            <p>Every record and every AI feature, together.</p>
            <ul><li>Unlimited records</li><li>Every AI feature</li><li>All workspace capabilities</li></ul>
            <a className="gh-button gh-button-gold" href="/signup?plan=pro">Choose Pro <Arrow /></a>
          </article>
        </div>
        <p className="gh-plan-note gh-reveal">Public account creation is currently closed while hosting and privacy setup are finalized.</p>
      </section>

      <section className="gh-last-call">
        <span className="gh-last-index">WRISTBY — 04</span>
        <div className="gh-last-copy gh-reveal">
          <span className="gh-kicker">YOUR NEXT DEAL, IN VIEW</span>
          <h2>Keep the details<br />in their <em>place.</em></h2>
          <p>A private workspace for the people and watches behind your business.</p>
          <a href="/signup" className="gh-button gh-button-dark">Create your workspace <Arrow /></a>
          <span className="gh-last-caption">A CLEARER PLACE TO BEGIN</span>
        </div>
      </section>

      <footer className="gh-footer">
        <a href="#gh-top" className="gh-brand" aria-label="WRISTBY home"><span className="gh-brand-mark">W</span><span>WRISTBY</span></a>
        <p>Private workspace for independent watch dealers</p>
        <nav aria-label="Footer navigation"><a href="mailto:contact@wristby.com">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Sign in</a><a href="/signup">Get started <Arrow /></a></nav>
        <span className="gh-copyright">© WRISTBY</span>
      </footer>
    </main>
  );
}

export default GoldenHourLanding;
