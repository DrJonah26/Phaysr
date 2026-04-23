import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2, ScanEye, Crosshair,
  Eye, MessageCircle, Zap, TrendingDown, ArrowUpRight,
} from 'lucide-react';
import './landing.css';

export default function Landing() {
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const onScroll = () => {
      const y = window.scrollY + 80;
      sections.forEach((sec) => {
        const link = document.querySelector<HTMLAnchorElement>(`nav a[href="#${sec.id}"]`);
        if (!link) return;
        const el = sec as HTMLElement;
        link.style.color = (y >= el.offsetTop && y < el.offsetTop + el.offsetHeight)
          ? 'var(--ink)' : '';
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* NAV */}
      <nav>
        <a className="nav-logo" href="#">Phays<span>r</span></a>
        <ul className="nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#compare">vs. Alternatives</a></li>
          <li><Link to="/signin" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink2)', textDecoration: 'none' }}>Sign in</Link></li>
          <li><Link to="/signup" className="nav-cta">Sign up free</Link></li>
        </ul>
      </nav>

      {/* HERO */}
      <section id="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          One script tag. Zero setup. Live today.
        </div>
        <h1>The AI assistant that <em>sees</em> your product</h1>
        <p className="hero-sub">Phaysr embeds in any SaaS with a single line of code — and guides users by pointing at the exact element they need, like a human support agent on screen.</p>
        <div className="hero-actions">
          <Link to="/signup" className="btn-primary-land">Get started free →</Link>
          <a href="#how" className="btn-secondary-land">See how it works →</a>
        </div>

        <div className="hero-video-wrap">
          <div className="browser-chrome">
            <div className="dot dot-r" /><div className="dot dot-y" /><div className="dot dot-g" />
            <div className="browser-bar">app.yourproduct.com</div>
          </div>
          <div className="video-container">
            <video autoPlay loop muted playsInline src="/phyasrdemo2_edited.mp4" style={{ objectFit: 'cover', position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section id="pain">
        <p className="section-label">The problem</p>
        <h2>Your users are lost. Your support team is drowning.</h2>
        <div className="pain-grid">
          {[
            { stat: '40%+', title: 'of tickets are "where do I click?"', desc: 'Support teams spend half their day answering navigation questions that a single highlighted arrow could have solved in two seconds.' },
            { stat: '60%',  title: 'of new users churn before their aha-moment', desc: "Onboarding tours feel patronizing, break on layout changes, and get skipped entirely. Users quit before they understand your product's value." },
            { stat: '3×',   title: 'features go unused — they just aren\'t discovered', desc: "You built it. They don't know it exists. Feature adoption is low not because users don't want it, but because they never find it." },
            { stat: 'Weeks',title: 'lost setting up Pendo, Appcues, Intercom tours', desc: 'Existing tools demand elaborate setup, constant maintenance, and break every time you ship a UI update. The overhead kills momentum.' },
          ].map((c) => (
            <div className="pain-card" key={c.stat}>
              <div className="pain-stat">{c.stat}</div>
              <div className="pain-title">{c.title}</div>
              <p className="pain-desc">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="inner">
          <p className="section-label">How it works</p>
          <h2>From install to intelligent support in three steps</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">Step 01</div>
              <div className="step-icon"><Code2 size={22} /></div>
              <h3>Paste one script tag</h3>
              <p>Drop a single line into your app's HTML — no SDKs, no build step, no config files. Phaysr is live immediately.</p>
              <div className="step-code">{'<script src="https://phaysr.ai/embed.js"\n  data-key="YOUR_KEY"></script>'}</div>
            </div>
            <div className="step">
              <div className="step-num">Step 02</div>
              <div className="step-icon"><ScanEye size={22} /></div>
              <h3>AI reads the live page</h3>
              <p>Phaysr captures the current DOM and a screenshot in real time — it knows exactly what the user is looking at, not just what the page should look like.</p>
            </div>
            <div className="step">
              <div className="step-num">Step 03</div>
              <div className="step-icon"><Crosshair size={22} /></div>
              <h3>Points at the exact element</h3>
              <p>When a user asks a question, Phaysr highlights the precise UI element they need — a visual pulse, not a wall of text. Like a human pointing at a screen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <p className="section-label">Features</p>
        <h2>Built to work without your product team babysitting it</h2>
        <div className="features-grid">
          {[
            { icon: <Eye size={20} />,          title: 'Visual context awareness',   desc: 'Reads both the DOM and a live screenshot — understands layout, not just element names. Works even when your selectors change.' },
            { icon: <Crosshair size={20} />,    title: 'Element highlighting',       desc: 'Pulses a visual indicator directly on the element the user needs to interact with. No ambiguous instructions.' },
            { icon: <MessageCircle size={20} />,title: 'Floating chat bubble',       desc: 'Sits unobtrusively in the corner of your app — available on demand, never in the way. Feels native, not bolted on.' },
            { icon: <Zap size={20} />,          title: 'Zero-maintenance setup',     desc: 'No tours to record, no flows to configure. Phaysr understands your product from the live page — ship UI changes freely.' },
            { icon: <TrendingDown size={20} />, title: 'Support ticket deflection',  desc: 'Handles "where do I click?" questions instantly. Your support team gets to focus on problems that actually need humans.' },
            { icon: <ArrowUpRight size={20} />, title: 'Accelerates aha-moments',   desc: 'Guides new users to their first win before they churn. No onboarding tour required — just answers when they need them.' },
          ].map((f) => (
            <div className="feat" key={f.title}>
              <div className="feat-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section id="compare">
        <div className="inner">
          <p className="section-label">vs. alternatives</p>
          <h2>Why teams switch to Phaysr</h2>
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                <th className="phaysr-head">Phaysr</th>
                <th>Intercom Tours</th>
                <th>Pendo / Appcues</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Setup time', <strong>One script tag</strong>, 'Days–weeks', 'Weeks–months'],
                ['Survives UI changes', <span className="check">✓</span>, <span className="cross">✗</span>, <span className="cross">✗</span>],
                ['Sees the live page visually', <span className="check">✓</span>, <span className="cross">✗</span>, <span className="cross">✗</span>],
                ['Highlights exact UI element', <span className="check">✓</span>, <span className="partial">Guided tours only</span>, <span className="partial">Guided tours only</span>],
                ['Works without configuration', <span className="check">✓</span>, <span className="cross">✗</span>, <span className="cross">✗</span>],
                ['Price', <strong>Starts free</strong>, '$$$', '$$$$'],
              ].map(([label, phaysr, col2, col3]) => (
                <tr key={String(label)}>
                  <td>{label}</td>
                  <td className="phaysr-cell">{phaysr}</td>
                  <td>{col2}</td>
                  <td>{col3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <p className="section-label">Get started</p>
        <h2>Ship <em>AI that sees</em> — in 60 seconds</h2>
        <p>Create an account, paste one script tag, and your users get an AI guide that highlights the exact element they need.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Link to="/signup" className="btn-primary-land" style={{ padding: '15px 34px' }}>Create your account →</Link>
          <a href="/demo-site/" className="btn-secondary-land">See live demo</a>
        </div>
        <p className="form-note">Free to start. No credit card required.</p>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="logo">Phays<span>r</span></div>
        <div>AI that sees your product. One line of code.</div>
        <div>© 2026 Phaysr</div>
      </footer>
    </>
  );
}
