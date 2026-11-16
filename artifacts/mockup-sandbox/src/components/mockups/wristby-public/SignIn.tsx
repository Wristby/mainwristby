import "./_group.css";
import { useState } from "react";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <main className="wba-auth">
      <style>{`
        .wba-auth{--ink:#20352c;--muted:#68756d;--line:#dce1d8;min-height:100dvh;background:#e8ebe3;color:var(--ink);display:grid;grid-template-columns:1.05fr .95fr;font-family:"Avenir Next",Avenir,ui-sans-serif,system-ui,sans-serif}.wba-auth *{box-sizing:border-box}.wba-left{background:#263d33;color:#f1f1e9;display:flex;flex-direction:column;justify-content:space-between;padding:34px clamp(26px,5vw,76px);min-height:100dvh;position:relative;overflow:hidden}.wba-brand{display:flex;align-items:center;gap:12px;color:inherit;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.19em}.wba-brand img{width:29px;height:29px;filter:brightness(0) invert(1);object-fit:contain}.wba-note{position:relative;z-index:1;padding:0 0 9vh}.wba-note small{font:10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.17em;color:#bbc8bc}.wba-note h1{font-size:clamp(44px,6vw,83px);line-height:.94;letter-spacing:-.075em;font-weight:450;max-width:550px;margin:26px 0}.wba-note h1 em{font-family:Georgia,serif;font-weight:400}.wba-note p{font-size:13px;line-height:1.8;color:#c4cec4;max-width:325px}.wba-left footer{font:9px ui-monospace,monospace;color:#a9b9aa;letter-spacing:.06em}.wba-right{display:flex;align-items:center;justify-content:center;padding:36px}.wba-form-wrap{width:100%;max-width:380px;animation:wba-enter .6s both}.wba-mobile-brand{display:none}.wba-kicker{font:10px ui-monospace,monospace;letter-spacing:.15em;text-transform:uppercase;color:#78847a}.wba-form-wrap h2{font-size:38px;line-height:1.02;letter-spacing:-.06em;font-weight:550;margin:17px 0 9px}.wba-sub{font-size:13px;color:#788179;margin:0 0 34px}.wba-form{display:grid;gap:20px}.wba-field label{display:block;font-size:11px;font-weight:600;margin:0 0 8px}.wba-field input{width:100%;height:49px;border:1px solid #cfd6cd;border-radius:2px;background:#f3f4ee;padding:0 14px;font:13px inherit;color:#20352c;outline:none;transition:border-color .2s,box-shadow .2s}.wba-field input:focus{border-color:#506d5c;box-shadow:0 0 0 3px #45645018}.wba-field input::placeholder{color:#9ba49b}.wba-forgot{text-align:right;margin-top:-9px;font-size:11px}.wba-forgot a,.wba-signup a{color:#3d5c49;text-underline-offset:3px}.wba-submit{border:0;background:#263d33;color:#fff;height:50px;width:100%;border-radius:2px;font:600 12px inherit;letter-spacing:.02em;cursor:pointer;transition:background .2s,transform .2s}.wba-submit:hover{background:#355446;transform:translateY(-1px)}.wba-feedback{padding:11px 12px;background:#dfe8da;border-left:2px solid #6c8a6d;color:#3c5645;font-size:11px;line-height:1.6;margin-top:16px}.wba-signup{font-size:11px;color:#7b847d;text-align:center;margin-top:27px}.wba-divider{height:1px;background:#d9ded6;margin:29px 0 19px}.wba-private{font:9px ui-monospace,monospace;letter-spacing:.04em;text-align:center;color:#929a92}@keyframes wba-enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@media(max-width:760px){.wba-auth{grid-template-columns:1fr}.wba-left{min-height:220px;padding:21px 25px}.wba-note{padding:40px 0 0}.wba-note small{font-size:9px}.wba-note h1{font-size:40px;margin:14px 0 8px;max-width:430px}.wba-note p,.wba-left footer{display:none}.wba-right{padding:42px 25px;align-items:flex-start}.wba-form-wrap{max-width:480px}.wba-mobile-brand{display:block;margin-bottom:34px}.wba-mobile-brand img{width:29px;height:29px;filter:brightness(.4)}.wba-form-wrap h2{font-size:34px}}@media(prefers-reduced-motion:reduce){.wba-auth *{animation:none!important;transition:none!important}}
      `}</style>
      <section className="wba-left">
        <a className="wba-brand" href="/" aria-label="WRISTBY home"><img src="/__mockup/images/wristby-logo.png" alt="" /> WRISTBY</a>
        <div className="wba-note"><small>Your business, in its place</small><h1>Every detail has<br />a <em>home.</em></h1><p>A private workspace for the watches, people and decisions behind your business.</p></div>
        <footer>PRIVATE WORKSPACE · INDEPENDENT WATCH DEALERS</footer>
      </section>
      <section className="wba-right"><div className="wba-form-wrap">
        <a className="wba-mobile-brand" href="/" aria-label="WRISTBY home"><img src="/__mockup/images/wristby-logo.png" alt="WRISTBY" /></a>
        <div className="wba-kicker">Welcome back</div><h2>Sign in to<br />your workspace.</h2><p className="wba-sub">Your watch business is right where you left it.</p>
        <form className="wba-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
          <div className="wba-field"><label htmlFor="wba-email">Email address</label><input id="wba-email" type="email" autoComplete="email" placeholder="you@yourbusiness.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="wba-field"><label htmlFor="wba-password">Password</label><input id="wba-password" type="password" autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <div className="wba-forgot"><a href="#forgot" onClick={(event) => { event.preventDefault(); setSubmitted(true); }}>Forgot password?</a></div>
          <button className="wba-submit" type="submit">Sign in to WRISTBY <span aria-hidden="true">↗</span></button>
        </form>
        {submitted && <div className="wba-feedback" role="status">This is a visual prototype. No sign-in request was sent.</div>}
        <div className="wba-signup">New to WRISTBY? <a href="/signup">Create a workspace</a></div><div className="wba-divider" /><div className="wba-private">PRIVATE BY DESIGN · YOUR DATA STAYS YOURS</div>
      </div></section>
    </main>
  );
}
