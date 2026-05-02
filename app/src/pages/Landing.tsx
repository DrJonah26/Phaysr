import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2, ScanEye, Crosshair,
  Eye, ListOrdered, Zap, TrendingDown, ArrowUpRight,
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
    <div className="landing-page">
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
        <p className="hero-sub">Paste one script tag and Phaysr is live. It guides your users step by step, pointing at the exact element they need right on screen. Like a human support agent, without the headcount.</p>
        <div className="hero-actions">
          <Link to="/signup" className="btn-primary-land">Get started free →</Link>
          <Link to="/demo-site" className="btn-secondary-land">Try live demo →</Link>
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
            { stat: '3×',   title: 'features go unused. They just aren\'t discovered', desc: "You built it. They don't know it exists. Feature adoption is low not because users don't want it, but because they never find it." },
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
              <p>Drop a single line into your app's HTML. No SDKs, no build step, no config files. Phaysr is live immediately.</p>
              <div className="step-code">{'<script\n  src="https://cdn.phaysr.ai/widget.js"\n  data-api-key="phs_live_YOUR_KEY"\n  data-site-name="MyApp"\n  data-color="#6366f1"\n  data-backend-url="https://api.phaysr.ai"\n  defer\n></script>'}</div>
            </div>
            <div className="step">
              <div className="step-num">Step 02</div>
              <div className="step-icon"><ScanEye size={22} /></div>
              <h3>AI reads the live page</h3>
              <p>On every question, Phaysr captures a DOM snapshot and a screenshot of the current viewport. It knows the exact layout the user is looking at right now, not a cached version of your app.</p>
            </div>
            <div className="step">
              <div className="step-num">Step 03</div>
              <div className="step-icon"><Crosshair size={22} /></div>
              <h3>Guides them through it</h3>
              <p>Phaysr highlights the exact element with a visual pulse and walks users through multi-step tasks one step at a time. After each action, just hit Continue and Phaysr checks the updated page to give the next instruction.</p>
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
            { icon: <Eye size={20} />,          title: 'Visual context awareness',   desc: 'On every question, Phaysr reads the DOM and takes a live screenshot. It knows what your users actually see at that moment, not a cached version of your app.' },
            { icon: <Crosshair size={20} />,    title: 'Pixel-perfect highlighting', desc: 'Phaysr uses CSS selectors to pulse an animated ring around the exact element the user needs. It stays accurate after scrolling and survives layout changes.' },
            { icon: <ListOrdered size={20} />,  title: 'Step-by-step guided flows',  desc: 'For multi-step tasks, Phaysr gives one instruction at a time. After each step, it re-reads the live page and continues up to six steps deep.' },
            { icon: <Zap size={20} />,          title: 'Zero-maintenance setup',     desc: 'No tours to record, no flows to configure, no selectors to maintain. Phaysr reads your live page on demand. Ship UI changes freely.' },
            { icon: <TrendingDown size={20} />, title: 'Support ticket deflection',  desc: 'Phaysr answers navigation questions right inside the app, the moment users get stuck. Your support team gets to focus on problems that actually need humans.' },
            { icon: <ArrowUpRight size={20} />, title: 'Feed it your docs',          desc: 'Point Phaysr at your FAQ or documentation URL. It retrieves relevant sections per question so answers are specific to your product, not generic AI.' },
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
                ['Highlights exact UI element', <span className="check">✓</span>, <span className="partial">Tours only</span>, <span className="partial">Tours only</span>],
                ['Guides multi-step tasks', <span className="check">✓</span>, <span className="partial">Scripted flows</span>, <span className="partial">Scripted flows</span>],
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
        <h2>Get started in only <em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>60 seconds</em></h2>
        <p>Create an account, paste one script tag, and your users get an AI guide that reads the live page and walks them through anything step by step.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Link to="/signup" className="btn-primary-land" style={{ padding: '15px 34px' }}>Create your account →</Link>
          <a href="/demo-site/" className="btn-secondary-land">See live demo</a>
        </div>
        <p className="form-note">Free to start. No credit card required.</p>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="logo">Phays<span>r</span></div>
        <div>AI that sees your product and guides users through it.</div>
        <div>© 2026 Phaysr</div>
      </footer>
    </div>
  );
}
