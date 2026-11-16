import "./PublicLandingRedesign.css";

const capabilities = [
  {
    number: "01",
    label: "THE WATCH",
    title: "A record with a memory.",
    text: "Keep reference, condition, provenance and status together, from the first sourcing note to the final sale.",
  },
  {
    number: "02",
    label: "THE NUMBERS",
    title: "Know what sits behind the ask.",
    text: "Keep acquisition and service costs beside your asking price, so the shape of a deal is always in view.",
  },
  {
    number: "03",
    label: "THE PEOPLE",
    title: "Remember what matters to a buyer.",
    text: "Bring client notes and interests into the same context as the watches and conversations they belong to.",
  },
  {
    number: "04",
    label: "THE HANDOVER",
    title: "Carry the details beyond the sale.",
    text: "Keep delivery, sale and warranty information connected to the watch record after it leaves your hands.",
  },
];

function Arrow() {
  return <span className="wr-arrow" aria-hidden="true">↗</span>;
}

export function PublicLandingRedesign() {
  return (
    <main className="wr-page" id="top">
      <header className="wr-header">
        <a className="wr-brand" href="#top" aria-label="WRISTBY home">
          <img src="/__mockup/images/wristby-logo.png" alt="" />
          <span>WRISTBY</span>
        </a>
        <nav className="wr-nav" aria-label="Main navigation">
          <a href="#workspace">Workspace</a>
          <a href="#capabilities">What it holds</a>
          <a href="#pricing">Pricing</a>
          <a className="wr-login" href="/login">Sign in</a>
          <a className="wr-nav-cta" href="/signup">Create your workspace <Arrow /></a>
        </nav>
      </header>

      <section className="wr-hero">
        <div className="wr-hero-copy">
          <div className="wr-eyebrow"><span className="wr-dot" /> A private workspace for independent watch dealers</div>
          <h1>The work behind<br />every <em>good watch.</em></h1>
          <div className="wr-hero-bottom">
            <p>From the first sourcing note to the warranty after the sale. Keep your stock, clients and the small details that make a deal in one considered place.</p>
            <a className="wr-button" href="/signup">Find your clear view <Arrow /></a>
          </div>
        </div>
        <figure className="wr-hero-visual">
          <img src="/__mockup/images/wristby-editorial.jpg" alt="Fictional vintage steel wristwatch in a quiet, naturally lit studio" />
          <div className="wr-image-wash" />
          <figcaption><span>FIELD NOTES / 01</span><span>Steel, considered.</span></figcaption>
          <div className="wr-image-stamp">A better<br />view of<br /><i>the trade</i></div>
        </figure>
        <div className="wr-hero-foot"><span>Made for the independent dealer</span><span>Stock · People · Aftercare</span></div>
      </section>

      <section className="wr-intro" id="workspace">
        <div className="wr-section-kicker">A little more room to think <span>01 — THE WORKSPACE</span></div>
        <div className="wr-intro-grid">
          <h2>Good dealing<br />lives in the <em>details.</em></h2>
          <div className="wr-intro-text">
            <p>What you paid. What it needs. Who has been looking for one. Where it is going next.</p>
            <p>WRISTBY gives the moving parts of an independent watch business a shared home—without making the work about software.</p>
            <a className="wr-text-link" href="#capabilities">See what has a place here <Arrow /></a>
          </div>
        </div>
        <div className="wr-principles">
          <span><b>01</b> One record, from source to sale</span>
          <span><b>02</b> Costs beside the asking price</span>
          <span><b>03</b> The handover, still in view</span>
        </div>
      </section>

      <section className="wr-dashboard-section">
        <div className="wr-dashboard-heading">
          <div>
            <div className="wr-eyebrow">A workspace that feels like yours</div>
            <h2>See the whole picture.<br /><em>Stay with the work.</em></h2>
          </div>
          <p>Stock, margin and client context, thoughtfully arranged in one private workspace.</p>
        </div>
        <div className="wr-dashboard">
          <aside className="wr-dash-side">
            <div className="wr-dash-brand"><img src="/__mockup/images/wristby-logo.png" alt="" /> WRISTBY</div>
            <span className="wr-dash-caption">YOUR WORKSPACE</span>
            <div className="wr-side-item selected"><i /> Overview</div>
            <div className="wr-side-item"><i /> Inventory</div>
            <div className="wr-side-item"><i /> Clients</div>
            <div className="wr-side-item"><i /> Sales</div>
            <span className="wr-dash-caption wr-side-lower">BUSINESS</span>
            <div className="wr-side-item"><i /> Analysis</div>
            <div className="wr-side-item"><i /> Settings</div>
            <div className="wr-dash-profile"><span>AD</span><div>Alex Duval<small>Independent dealer</small></div></div>
          </aside>
          <div className="wr-dash-main">
            <div className="wr-demo-tag"><span /> Fictional demo data</div>
            <div className="wr-dash-title"><div><span className="wr-dash-date">MONDAY, 16 JUNE</span><h3>Good morning, Alex.</h3></div><button type="button" className="wr-demo-button" aria-label="Demo preview only">+ Add a watch</button></div>
            <div className="wr-stat-row">
              <article className="wr-stat"><span>Active watches</span><strong>08</strong><small>Across 5 brands</small><div className="wr-stat-mark">↗</div></article>
              <article className="wr-stat"><span>Asking value</span><strong>€84,650</strong><small>Inventory overview</small><div className="wr-stat-mark">◌</div></article>
              <article className="wr-stat"><span>Clients</span><strong>14</strong><small>Workspace contacts</small><div className="wr-stat-mark">◎</div></article>
            </div>
            <div className="wr-table-head"><strong>Recent inventory</strong><span>View all inventory <Arrow /></span></div>
            <div className="wr-stock-table">
              <div className="wr-stock-row wr-stock-labels"><span>WATCH</span><span>ACQUIRED</span><span>ASKING</span><span>STATUS</span></div>
              <div className="wr-stock-row"><span className="wr-watch-name"><i className="wr-watch-thumb one" />Steel calendar <small>36mm · Fictional demo</small></span><span>€4,200</span><span>€5,850</span><span><b className="wr-status listed" />Listed</span></div>
              <div className="wr-stock-row"><span className="wr-watch-name"><i className="wr-watch-thumb two" />Racing chronograph <small>39mm · Fictional demo</small></span><span>€8,900</span><span>€11,200</span><span><b className="wr-status listed" />Listed</span></div>
              <div className="wr-stock-row"><span className="wr-watch-name"><i className="wr-watch-thumb three" />Gold dress watch <small>34mm · Fictional demo</small></span><span>€6,350</span><span>€8,100</span><span><b className="wr-status service" />In service</span></div>
            </div>
            <div className="wr-dash-note">Illustrative workspace preview · all names, figures and inventory are fictional.</div>
          </div>
        </div>
        <div className="wr-dashboard-caption"><span>ONE PRIVATE VIEW</span><span>Built around the way a watch changes hands</span></div>
      </section>

      <section className="wr-capabilities" id="capabilities">
        <div className="wr-cap-intro">
          <div className="wr-eyebrow">02 — The details, together</div>
          <h2>Every part of<br />the <em>journey.</em></h2>
          <p>From first note to final handover, the context travels with the watch.</p>
        </div>
        <div className="wr-cap-list">
          {capabilities.map((item) => (
            <article className="wr-cap-row" key={item.number}>
              <span className="wr-cap-number">{item.number}</span>
              <div><span className="wr-cap-label">{item.label}</span><h3>{item.title}</h3><p>{item.text}</p></div>
              <span className="wr-cap-symbol" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="wr-interlude">
        <div className="wr-interlude-mark"><img src="/__mockup/images/wristby-logo.png" alt="" /></div>
        <div className="wr-eyebrow">A quieter kind of control</div>
        <h2>Software should<br />respect the <em>craft.</em></h2>
        <p>Less time looking for the details. More room to do what you do well.</p>
        <span className="wr-interlude-index">WRISTBY / INDEPENDENT BY DESIGN</span>
      </section>

      <section className="wr-access" id="pricing">
        <div className="wr-access-head">
          <div><div className="wr-eyebrow">03 — Access</div><h2>Start where<br />you <em>are.</em></h2></div>
          <p>The fundamentals are here when you’re starting out. Pro opens the full workspace as your business grows.</p>
        </div>
        <div className="wr-plan-grid">
          <article className="wr-plan-card">
            <div className="wr-plan-top"><span className="wr-plan-name">FREE</span><span className="wr-plan-note">A considered place to begin</span></div>
            <div className="wr-plan-price">€0 <small>/ month</small></div>
            <p>Keep the essentials in order, at your own pace.</p>
            <ul><li>Up to 10 active watches</li><li>Up to 25 clients</li><li>AI features unavailable</li></ul>
            <a className="wr-button wr-button-light" href="/signup?plan=free">Start on Free <Arrow /></a>
          </article>
          <article className="wr-plan-card wr-plan-pro">
            <div className="wr-plan-top"><span className="wr-plan-name">PRO</span><span className="wr-plan-note">For the whole picture</span></div>
            <div className="wr-plan-price">€39.99 <small>/ month</small></div>
            <p>Every record and every AI feature, together.</p>
            <ul><li>Unlimited records</li><li>Every AI feature</li><li>All workspace capabilities</li></ul>
            <a className="wr-button" href="/signup?plan=pro">Choose Pro <Arrow /></a>
          </article>
        </div>
        <p className="wr-plan-footnote">Choose the plan that fits the way you work. You can create a workspace at any time.</p>
      </section>

      <section className="wr-last-call">
        <div className="wr-last-call-inner">
          <div className="wr-eyebrow">Your next deal, in view</div>
          <h2>Keep the details<br />in their <em>place.</em></h2>
          <p>A private workspace for the people and watches behind your business.</p>
          <a className="wr-button wr-button-paper" href="/signup">Create your workspace <Arrow /></a>
          <span className="wr-last-note">A clearer place to begin.</span>
        </div>
      </section>

      <footer className="wr-footer">
        <a className="wr-brand" href="#top" aria-label="WRISTBY home"><img src="/__mockup/images/wristby-logo.png" alt="" /><span>WRISTBY</span></a>
        <span className="wr-footer-description">Private workspace for independent watch dealers</span>
        <nav aria-label="Footer navigation"><a href="mailto:contact@wristby.com">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/login">Sign in</a><a href="/signup">Get started <Arrow /></a></nav>
        <span className="wr-copyright">© WRISTBY</span>
      </footer>
    </main>
  );
}

export default PublicLandingRedesign;
