import "./_group.css";
import { useState } from "react";

export function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <main className="wbs-auth">
      <style>{`
        .wbs-auth{--ink:#20352c;--muted:#68756d;min-height:100dvh;background:#e8ebe3;color:var(--ink);display:grid;grid-template-columns:1.05fr .95fr;font-family:"Avenir Next",Avenir,ui-sans-serif,system-ui,sans-serif}.wbs-auth *{box-sizing:border-box}.wbs-left{background:#263d33;color:#f1f1e9;display:flex;flex-direction:column;justify-content:space-between;padding:34px clamp(26px,5vw,76px);min-height:100dvh;position:relative;overflow:hidden}.wbs-brand{display:flex;align-items:center;gap:12px;color:inherit;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.19em}.wbs-brand img{width:29px;height:29px;filter:brightness(0) invert(1);object-fit:contain}.wbs-story{padding:0 0 8vh;position:relative;z-index:1}.wbs-story small{font:10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.17em;color:#bbc8bc}.wbs-story h1{font-size:clamp(44px,6vw,82px);line-height:.94;letter-spacing:-.075em;font-weight:450;max-width:560px;margin:26px 0}.wbs-story h1 em{font-family:Georgia,serif;font-weight:400}.wbs-story p{font-size:13px;line-height:1.8;color:#c4cec4;max-width:350px}.wbs-quote{border-top:1px solid #ffffff30;padding-top:22px;margin-top:48px;max-width:370px}.wbs-quote span{display:block;font:9px ui-monospace,monospace;color:#b8c6b8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}.wbs-quote p{font:16px Georgia,serif;color:#f0f0e8;line-height:1.5}.wbs-left footer{font:9px ui-monospace,monospace;color:#a9b9aa;letter-spacing:.06em}.wbs-right{display:flex;align-items:center;justify-content:center;padding:36px}.wbs-form-wrap{width:100%;max-width:390px;animation:wbs-enter .6s both}.wbs-mobile-brand{display:none}.wbs-kicker{font:10px ui-monospace,monospace;letter-spacing:.15em;text-transform:uppercase;color:#78847a}.wbs-form-wrap h2{font-size:37px;line-height:1.02;letter-spacing:-.06em;font-weight:550;margin:17px 0 9px}.wbs-sub{font-size:13px;color:#788179;margin:0 0 27px}.wbs-form{display:grid;gap:16px}.wbs-field label{display:block;font-size:11px;font-weight:600;margin:0 0 7px}.wbs-field input{width:100%;height:47px;border:1px solid #cfd6cd;border-radius:2px;background:#f3f4ee;padding:0 14px;font:13px inherit;color:#20352c;outline:none;transition:border-color .2s,box-shadow .2s}.wbs-field input:focus{border-color:#506d5c;box-shadow:0 0 0 3px #45645018}.wbs-field input::placeholder{color:#9ba49b}.wbs-plan-note{background:#e0e5db;border:1px solid #d3dbd0;padding:13px 15px;margin:21px 0;font-size:11px;color:#57645a;line-height:1.6}.wbs-plan-note strong{color:#304538;font-weight:650}.wbs-submit{border:0;background:#263d33;color:#fff;height:50px;width:100%;border-radius:2px;font:600 12px inherit;letter-spacing:.02em;cursor:pointer;transition:background .2s,transform .2s}.wbs-submit:hover{background:#355446;transform:translateY(-1px)}.wbs-feedback{padding:11px 12px;background:#dfe8da;border-left:2px solid #6c8a6d;color:#3c5645;font-size:11px;line-height:1.6;margin-top:15px}.wbs-login{font-size:11px;color:#7b847d;text-align:center;margin-top:22px}.wbs-login a{color:#3d5c49;text-underline-offset:3px}.wbs-terms{font:9px ui-monospace,monospace;line-height:1.65;text-align:center;color:#929a92;margin-top:23px}@keyframes wbs-enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@media(max-width:760px){.wbs-auth{grid-template-columns:1fr}.wbs-left{min-height:255px;padding:21px 25px}.wbs-story{padding:38px 0 0}.wbs-story small{font-size:9px}.wbs-story h1{font-size:40px;margin:14px 0 8px}.wbs-story>p,.wbs-left footer,.wbs-quote{display:none}.wbs-right{padding:38px 25px;align-items:flex-start}.wbs-form-wrap{max-width:480px}.wbs-mobile-brand{display:block;margin-bottom:28px}.wbs-mobile-brand img{width:29px;height:29px;filter:brightness(.4)}.wbs-form-wrap h2{font-size:34px}}@media(prefers-reduced-motion:reduce){.wbs-auth *{animation:none!important;transition:none!important}}
      `}</style>
      <section className="wbs-left">
        <a className="wbs-brand" href="/" aria-label="WRISTBY home"><img src="/__mockup/images/wristby-logo.png" alt="" /> WRISTBY</a>
        <div className="wbs-story"><small>Space for your trade</small><h1>Make every<br />detail <em>count.</em></h1><p>Bring the records, relationships and rhythm of your watch business together.</p><div className="wbs-quote"><span>The WRISTBY approach</span><p>“A clear view of the work behind every good watch.”</p></div></div>
        <footer>PRIVATE WORKSPACE · INDEPENDENT WATCH DEALERS</footer>
      </section>
      <section className="wbs-right"><div className="wbs-form-wrap">
        <a className="wbs-mobile-brand" href="/" aria-label="WRISTBY home"><img src="/__mockup/images/wristby-logo.png" alt="WRISTBY" /></a>
        <div className="wbs-kicker">Start your workspace</div><h2>A place for<br />your business.</h2><p className="wbs-sub">Create your account. Choose your plan later.</p>
        <form className="wbs-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
          <div className="wbs-field"><label htmlFor="wbs-name">Your name</label><input id="wbs-name" type="text" autoComplete="name" placeholder="Name" required value={name} onChange={(event) => setName(event.target.value)} /></div>
          <div className="wbs-field"><label htmlFor="wbs-email">Email address</label><input id="wbs-email" type="email" autoComplete="email" placeholder="you@yourbusiness.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="wbs-field"><label htmlFor="wbs-password">Create a password</label><input id="wbs-password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <div className="wbs-plan-note"><strong>Start on Free.</strong> Up to 10 active watches and 25 clients. AI unavailable. Pro is €39.99/month for unlimited records and every AI feature.</div>
          <button className="wbs-submit" type="submit">Create your workspace <span aria-hidden="true">↗</span></button>
        </form>
        {submitted && <div className="wbs-feedback" role="status">This is a visual prototype. No account was created.</div>}
        <div className="wbs-login">Already have a workspace? <a href="/login">Sign in</a></div>
        <div className="wbs-terms">By continuing, you agree to keep your account details private. No account request is sent from this prototype.</div>
      </div></section>
    </main>
  );
}
