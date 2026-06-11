import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';

interface Ticket {
  id: number;
  q: string;
  name: string;
  minutesAgo: number;
  color: string;
  isNew: boolean;
}

const INITIAL_TICKETS: Ticket[] = [
  { id: 0, q: 'How do I find the export option for my report?', name: 'Jordan D.', minutesAgo: 0, color: '#9C5959', isNew: false },
  { id: 1, q: 'How do I invite a teammate?',              name: 'Priya S.',  minutesAgo: 1, color: '#5a6b8c', isNew: false },
  { id: 2, q: "I can't find the billing settings.",       name: 'Marcus L.', minutesAgo: 2, color: '#6b8c5a', isNew: false },
  { id: 3, q: "Where's the button to upgrade my plan?",   name: 'Ana R.',    minutesAgo: 3, color: '#8c6b5a', isNew: false },
  { id: 4, q: 'How do I connect my data source?',         name: 'Tom K.',    minutesAgo: 4, color: '#7a5a8c', isNew: false },
  { id: 5, q: 'Where do I change my password?',           name: 'Lena M.',   minutesAgo: 5, color: '#5a8c87', isNew: false },
];

const TICKET_QUEUE = [
  { q: 'Where do I find the API keys?',                   name: 'Sam W.',    color: '#9C5959' },
  { q: 'How do I reset my dashboard layout?',             name: 'Nina P.',   color: '#5a6b8c' },
  { q: "Where's the option to add a webhook?",            name: 'Carlos M.', color: '#6b8c5a' },
  { q: "I can't locate the team permissions page.",       name: 'Yuki T.',   color: '#8c6b5a' },
  { q: "How do I download last month's invoice?",         name: 'Rosa G.',   color: '#7a5a8c' },
  { q: 'Where do I turn on two-factor auth?',             name: 'Ben H.',    color: '#5a8c87' },
  { q: 'How do I archive a project?',                     name: 'Mei L.',    color: '#9C5959' },
  { q: 'How can I share a report with my team?',          name: 'Omar F.',   color: '#5a6b8c' },
];

const FLOW_STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Open account settings',
    body: <>Click your <strong>avatar</strong> in the top-right corner, then select <strong>"Account settings"</strong> from the dropdown.</>,
  },
  {
    title: 'Go to Billing',
    body: <>In the left sidebar, scroll down and click <strong>"Billing &amp; Plans"</strong> to see your current subscription.</>,
  },
  {
    title: 'Pick a plan',
    body: <>Find the plan that fits you and click <strong>"Upgrade"</strong>. You can compare features by hovering each column.</>,
  },
  {
    title: 'Confirm payment',
    body: <>Review your billing details, then click <strong>"Confirm upgrade"</strong>. Your new plan activates immediately.</>,
  },
];

function useInView(ref: { current: Element | null }, threshold = 0.35): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return inView;
}

function useCountUp(target: number, duration: number, started: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, started]);
  return value;
}

function FlowCard() {
  const [step, setStep] = useState(0);
  const total = FLOW_STEPS.length;
  const { title, body } = FLOW_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === total - 1;

  return (
    <div className="flow">
      <div className="flow-head">
        <span className="flow-step-label">Step {step + 1} of {total}</span>
        <span className="flow-dots">
          {FLOW_STEPS.map((_, i) => <span key={i} className={i <= step ? 'on' : ''} />)}
        </span>
      </div>
      <div className="flow-body" key={step}>
        <b>{title}</b>
        {body}
      </div>
      <div className="flow-foot">
        <button
          className="flow-prev"
          onClick={() => setStep(s => s - 1)}
          disabled={isFirst}
          style={{ opacity: isFirst ? 0.3 : 1, cursor: isFirst ? 'default' : 'pointer' }}
        >
          ‹ Back
        </button>
        <button
          className="flow-continue"
          onClick={() => isLast ? setStep(0) : setStep(s => s + 1)}
          style={{ cursor: 'pointer' }}
        >
          {isLast ? 'Start over' : 'Continue'}
          {!isLast && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>}
        </button>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}

function timeLabel(m: number) {
  return m === 0 ? 'just now' : `${m}m ago`;
}

function BrandDots({ size = 22 }: { size?: number }) {
  return (
    <span className="brand-dots" style={{ width: size, height: size }}>
      <span /><span /><span /><span />
    </span>
  );
}

function SmallCheck({ w = 10 }: { w?: number }) {
  return (
    <svg width={w} height={w} viewBox="0 0 12 12" fill="none">
      <path d="M2 6.5 5 9l5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TicketDeflectionVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ticketRefs = useRef<(HTMLDivElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement>(null);
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const idx = useRef(0);
  const NUM = 6;

  useEffect(() => {
    const reset = () => {
      ticketRefs.current.forEach(t => t?.classList.remove('deflected'));
      idx.current = 0;
      if (countRef.current) countRef.current.textContent = String(NUM);
    };
    const step = () => {
      if (idx.current >= NUM) {
        timer.current = setTimeout(() => { reset(); step(); }, 1400);
        return;
      }
      ticketRefs.current[idx.current]?.classList.add('deflected');
      idx.current++;
      if (countRef.current) countRef.current.textContent = String(NUM - idx.current);
      timer.current = setTimeout(step, 850);
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting && !running.current) {
          running.current = true; reset(); timer.current = setTimeout(step, 600);
        } else if (!en.isIntersecting && running.current) {
          running.current = false; clearTimeout(timer.current);
        }
      });
    }, { threshold: 0.4 });
    if (containerRef.current) io.observe(containerRef.current);
    return () => { io.disconnect(); clearTimeout(timer.current); };
  }, []);

  const ROWS: [boolean][] = [[true], [false], [true], [false], [true], [false]];

  return (
    <div className="sv-queue" ref={containerRef}>
      <div className="sv-queue-head">
        <span>Incoming questions</span>
        <span>Open <span className="sv-queue-count" ref={countRef}>{NUM}</span></span>
      </div>
      {ROWS.map(([hasShort], i) => (
        <div key={i} className="sv-tk" ref={el => { ticketRefs.current[i] = el; }}>
          <span className="tk-dot" />
          <span className="tk-line" />
          {hasShort && <span className="tk-line short" />}
        </div>
      ))}
    </div>
  );
}

function StackCards() {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const updateStack = () => {
      const vh = window.innerHeight;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const next = cardRefs.current[i + 1];
        const dim = card.querySelector<HTMLElement>('.stack-dim');
        if (!next) { card.style.transform = ''; if (dim) dim.style.opacity = '0'; return; }
        const p = Math.max(0, Math.min(1, (vh - next.getBoundingClientRect().top) / (vh - 96)));
        card.style.transform = `scale(${1 - 0.06 * p})`;
        if (dim) dim.style.opacity = (0.22 * p).toFixed(3);
      });
    };

    let rafPending = false;
    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => { updateStack(); rafPending = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateStack);
    updateStack();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', updateStack); };
  }, []);

  const cardRef = (i: number) => (el: HTMLElement | null) => { cardRefs.current[i] = el; };

  return (
    <div className="hiw-stack">

      <article className="stack-card" style={{ '--i': 0 } as React.CSSProperties} ref={cardRef(0)}>
        <div className="stack-dim" />
        <div className="stack-left">
          <span className="stack-index">
            <span className="si-num">01</span><span className="si-rule" /><span className="si-label">Sees</span>
          </span>
          <h3>Visual context awareness</h3>
          <p className="stack-desc">Reads the DOM and takes a live screenshot on every question. It knows exactly what your users see, not a stale cached version.</p>
          <div className="stack-tags">
            <span>Live DOM</span><span>Screenshot per turn</span><span>No stale state</span>
          </div>
        </div>
        <div className="stack-visual">
          <div className="sv-scan">
            <div className="appwin">
              <div className="aw-side"><i /><i /><i /><i /></div>
              <div className="aw-main"><i /><i /><i /><div className="aw-btn" /></div>
            </div>
            <div className="scan-line" />
          </div>
          <div className="scan-chip sv-chip-float">
            <span className="ok"><SmallCheck w={8} /></span>
            DOM + screenshot read
          </div>
        </div>
      </article>

      <article className="stack-card" style={{ '--i': 1 } as React.CSSProperties} ref={cardRef(1)}>
        <div className="stack-dim" />
        <div className="stack-left">
          <span className="stack-index">
            <span className="si-num">02</span><span className="si-rule" /><span className="si-label">Installs</span>
          </span>
          <h3>Zero-maintenance setup</h3>
          <p className="stack-desc">No tours to record, no flows to configure, no selectors to maintain. Ship UI changes freely. Phaysr always reads the live page.</p>
          <div className="stack-tags">
            <span>One script tag</span><span>No selectors</span><span>Survives redesigns</span>
          </div>
        </div>
        <div className="stack-visual">
          <div className="sv-code-wrap">
            <div className="sv-code">{'<'}<span className="k">script</span>{' '}<span className="a">src</span>{'='}<span className="s">"phaysr.com/embed.js"</span>{'></'}<span className="k">script</span>{'>'}</div>
            <div className="sv-ship">
              <span className="tick"><SmallCheck /></span>
              <span>Shipped a redesign? <span className="ship-shift">Still works. Nothing to update.</span></span>
            </div>
          </div>
        </div>
      </article>

      <article className="stack-card" style={{ '--i': 2 } as React.CSSProperties} ref={cardRef(2)}>
        <div className="stack-dim" />
        <div className="stack-left">
          <span className="stack-index">
            <span className="si-num">03</span><span className="si-rule" /><span className="si-label">Deflects</span>
          </span>
          <h3>Support ticket deflection</h3>
          <p className="stack-desc">Answers navigation questions inside the app the moment users get stuck. Your team focuses on the problems that actually need a human.</p>
          <div className="stack-tags">
            <span>In-app answers</span><span>Fewer tickets</span><span>Instant</span>
          </div>
        </div>
        <div className="stack-visual">
          <TicketDeflectionVisual />
        </div>
      </article>

      <article className="stack-card" style={{ '--i': 3 } as React.CSSProperties} ref={cardRef(3)}>
        <div className="stack-dim" />
        <div className="stack-left">
          <span className="stack-index">
            <span className="si-num">04</span><span className="si-rule" /><span className="si-label">Knows</span>
          </span>
          <h3>Feed it your docs</h3>
          <p className="stack-desc">Point Phaysr at your FAQ or docs URL. It retrieves the relevant sections per question, so every answer is specific to your product.</p>
          <div className="stack-tags">
            <span>FAQ + docs</span><span>Retrieval per question</span><span>Product-specific</span>
          </div>
        </div>
        <div className="stack-visual">
          <div className="sv-docs">
            <div className="sv-doc" style={{ top: 30, left: 30, transform: 'rotate(-7deg)' }}><i/><i/><i/><i/><i/></div>
            <div className="sv-doc" style={{ top: 24, right: 34, transform: 'rotate(6deg)' }}><i/><i/><i/><i/><i/></div>
            <div className="sv-doc" style={{ bottom: 42, left: 46, transform: 'rotate(5deg)' }}><i/><i/><i/><i/><i/></div>
            <div className="sv-doc" style={{ bottom: 34, right: 30, transform: 'rotate(-6deg)' }}><i/><i/><i/><i/><i/></div>
            <div className="sv-ring-pulse" />
            <div className="sv-core"><BrandDots size={34} /></div>
            <div className="sv-indexed">
              <span className="tick"><SmallCheck w={9} /></span>
              214 sections indexed
            </div>
          </div>
        </div>
      </article>

      <div aria-hidden className="stack-spacer" />
    </div>
  );
}

function ProbStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const v60 = useCountUp(60, 1000, inView);
  const v3 = useCountUp(3, 900, inView);
  const v47 = useCountUp(47, 1100, inView);

  return (
    <div className="prob-stats" ref={ref}>
      <div className="prob-stat-row">
        <div className="prob-stat-num">{v60}%</div>
        <div className="prob-stat-text">
          <strong>of new users churn early</strong>
          Onboarding tours feel patronizing, break on layout changes, and get skipped. Users quit before their aha-moment.
        </div>
      </div>
      <div className="prob-stat-row">
        <div className="prob-stat-num">{v3}×</div>
        <div className="prob-stat-text">
          <strong>your features go undiscovered</strong>
          You built it but they don't know it exists. Adoption stays low not for lack of value, but because nobody finds it.
        </div>
      </div>
      <div className="prob-stat-row">
        <div className="prob-stat-num">{v47}h</div>
        <div className="prob-stat-text">
          <strong>per month lost to Pendo, Appcues &amp; Intercom</strong>
          Legacy tools demand elaborate setup and break every time you ship. The overhead kills momentum.
        </div>
      </div>
    </div>
  );
}

function StatsCard() {
  const ref = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<SVGPathElement>(null);
  const inView = useInView(ref, 0.1);
  const v94 = useCountUp(94, 1400, inView);

  useEffect(() => {
    const path = sparkRef.current;
    if (!path || !inView) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.25, 1, 0.5, 1)';
        path.style.strokeDashoffset = '0';
      });
    });
  }, [inView]);

  return (
    <div className="stats-card" ref={ref}>
      <h4>Questions answered correctly</h4>
      <div className="stats-num">
        {v94}%
        <span className="stats-trend">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 7 L5 3 L8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          +18%
        </span>
      </div>
      <svg className="sparkline" viewBox="0 0 200 40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
            <stop id="spark-stop-1" offset="0%" />
            <stop id="spark-stop-2" offset="100%" />
          </linearGradient>
        </defs>
        <path d="M0,32 L20,28 L40,30 L60,22 L80,24 L100,18 L120,14 L140,16 L160,10 L180,8 L200,4 L200,40 L0,40 Z" fill="url(#spark)"/>
        <path ref={sparkRef} className="spark-line" d="M0,32 L20,28 L40,30 L60,22 L80,24 L100,18 L120,14 L140,16 L160,10 L180,8 L200,4" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="integrations">
        <span className="integrations-label">Works with</span>
        <div className="integration-logos">
          <div className="ig-react">⚛</div>
          <div className="ig-vue">V</div>
          <div className="ig-wf">W</div>
          <div className="ig-shop">S</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [count, setCount] = useState(1247);
  const [menuOpen, setMenuOpen] = useState(false);
  const queueIdx = useRef(0);
  const nextId = useRef(INITIAL_TICKETS.length);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const item = TICKET_QUEUE[queueIdx.current % TICKET_QUEUE.length];
      queueIdx.current++;
      const id = nextId.current++;

      setCount(c => c + Math.floor(Math.random() * 3) + 1);
      setTickets(prev => {
        const aged = prev.map(t => ({ ...t, isNew: false, minutesAgo: t.minutesAgo + 1 }));
        return [{ id, q: item.q, name: item.name, minutesAgo: 0, color: item.color, isNew: true }, ...aged].slice(0, 7);
      });
      setTimeout(() => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, isNew: false } : t));
      }, 600);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page">
      <div className="frame">
        <div className="canvas">

          {/* NAV */}
          <nav className="l-nav">
            <a className="brand" href="#">
              <BrandDots size={22} />
              Phaysr
            </a>
            <ul className="l-menu">
              <li><a href="#problem">Problem</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="mailto:jonah.alt@gmx.de">Contact</a></li>
            </ul>
            <div className="nav-right">
              <Link className="l-signin" to="/signin">Sign in</Link>
              <Link className="l-cta" to="/signup">Try for free</Link>
              <button
                className={`hamburger${menuOpen ? ' open' : ''}`}
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                <span /><span /><span />
              </button>
            </div>
          </nav>

          {/* MOBILE MENU */}
          {menuOpen && (
            <div className="mobile-menu">
              <a href="#problem" onClick={closeMenu}>Problem</a>
              <a href="#how" onClick={closeMenu}>How it works</a>
              <a href="#features" onClick={closeMenu}>Features</a>
              <a href="#pricing" onClick={closeMenu}>Pricing</a>
              <a href="mailto:jonah.alt@gmx.de" onClick={closeMenu}>Contact</a>
              <div className="mobile-menu-actions">
                <Link to="/signin" onClick={closeMenu} className="mobile-signin">Sign in</Link>
                <Link className="cta-primary" to="/signup" onClick={closeMenu} style={{ padding: '12px 24px', fontSize: 14 }}>Try for free</Link>
              </div>
            </div>
          )}

          {/* TOP-LEFT WIDGET: multilingual chat cluster */}
          <div className="widget w-note">
            <div className="lang-cluster">
              <div className="lang-bubble lang-en">
                <span className="lang-tag">EN</span>
                How do I create a new workspace?
              </div>
              <div className="lang-bubble lang-de">
                <span className="lang-tag">DE</span>
                Wie erstelle ich einen neuen Workspace?
              </div>
              <div className="lang-bubble lang-ja">
                <span className="lang-tag">JA</span>
                新しいワークスペースを作るには？
              </div>
              <div className="lang-foot">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
                </svg>
                Answers in any language. Zero setup.
              </div>
            </div>
          </div>

          {/* TOP-RIGHT WIDGET: install snippet */}
          <div className="widget w-install">
            <div className="install-stack" />
            <div className="install-card">
              <div className="card-head">
                <span>Install</span>
                <span className="pill">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5 L5 9 L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Live in 4 min
                </span>
              </div>
              <div className="code-snippet">
                <span className="tag">&lt;script</span> <span className="attr">src</span>=<span className="str">"cdn.phaysr.com/widget.js"</span>{'\n'}
                {'  '}<span className="attr">data-key</span>=<span className="str">"pk_live_…"</span>{'\n'}
                <span className="tag">&gt;&lt;/script&gt;</span>
              </div>
              <div className="install-foot">
                <span className="dot" />
                One tag · No SDK · No pre-built flows
              </div>
            </div>
          </div>

          {/* HERO */}
          <section className="hero">
            <div className="hero-badge">
              <BrandDots size={26} />
            </div>
            <h1 className="headline">
              The better version
              <span className="line-2">of a chatbot.</span>
            </h1>
            <p className="hero-sub">
              Phaysr looks at your website, then shows users exactly which buttons to click to help them solve their problems.
            </p>
            <div className="hero-actions">
              <Link className="cta-primary" to="/signup">Try for free</Link>
              <a className="cta-ghost hero-demo" href="https://demo.phaysr.com">Test live demo</a>
            </div>
          </section>

          {/* BOTTOM-LEFT WIDGET: live session */}
          <div className="widget w-tour">
            <div className="tour-card">
              <div className="tour-head">
                <h4>Live session · AI answering</h4>
                <span className="tour-live">Live</span>
              </div>
              <div className="tour-input-bar">
                <div className="tour-input-bar-inner">
                  <span style={{ flex: 1 }}>How do I upgrade my plan?</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9a9a9d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </div>
              </div>
              <div className="tour-body">
                <div className="tour-mock">
                  <div className="tour-side">
                    <i /><i /><i /><i />
                  </div>
                  <div className="tour-main">
                    <i /><i /><i />
                    <div className="tour-cta-fake" />
                    <div className="tour-tooltip">Click "Upgrade" in the sidebar →</div>
                    <svg className="tour-cursor" viewBox="0 0 32 32" fill="none">
                      <path className="accent-fill" d="M6 4 L6 25 L12 19 L16 27 L19 26 L15 18 L23 18 Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM-RIGHT WIDGET: stats */}
          <div className="widget w-stats">
            <StatsCard />
          </div>

        </div>{/* /canvas */}

        {/* DEMO VIDEO */}
        <section className="l-section video-section">
          <p className="eyebrow video-eyebrow"><span className="e-dot" />See it live</p>
          <h2 className="video-title">Watch Phaysr in action</h2>
          <div className="video-browser">
            <div className="video-chrome">
              <span className="chrome-dot chrome-red" />
              <span className="chrome-dot chrome-yellow" />
              <span className="chrome-dot chrome-green" />
              <span className="chrome-url">phaysr.com/dashboard</span>
            </div>
            <video
              className="demo-video"
              src="/phaysr demo teracotta sped up.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </section>

        {/* PROBLEM */}
        <section className="l-section" id="problem">
          <div className="problem-layout">
            <div className="prob-narrative">
              <span className="eyebrow"><span className="e-dot" />The problem</span>
              <h2 className="prob-title">
                Your users are lost. Your support team is <span className="p-accent">drowning.</span>
              </h2>
              <ProbStats />
            </div>

            {/* Animated inbox */}
            <div className="inbox">
              <div className="inbox-head">
                <div className="inbox-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                  </svg>
                  Support Inbox
                </div>
                <div className="inbox-badge">
                  <span className="pip" />
                  {count.toLocaleString()} unread
                </div>
              </div>
              <div className="inbox-list">
                {tickets.map(t => (
                  <div key={t.id} className={`ticket${t.isNew ? ' ticket-new' : ''}`}>
                    <div className="ticket-avatar" style={{ background: t.color }}>{initials(t.name)}</div>
                    <div className="ticket-body">
                      <div className="ticket-q">"{t.q}"</div>
                      <div className="ticket-meta">{t.name} · {timeLabel(t.minutesAgo)}</div>
                    </div>
                    <div className="ticket-tag">navigation</div>
                  </div>
                ))}
              </div>
              <div className="inbox-callout">
                <span className="co-dot" />
                <span><b>40%+</b> are "how do I find…?" questions</span>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <div className="l-panel" id="how">
          <section className="l-section l-section-stack">
            <div className="sec-head">
              <span className="eyebrow"><span className="e-dot" />How it works</span>
              <h2 className="sec-title">Everything it needs to guide your users</h2>
            </div>
            <StackCards />
          </section>
        </div>

        {/* FEATURES */}
        <section className="l-section" id="features">
          <div className="sec-head">
            <span className="eyebrow"><span className="e-dot" />Features</span>
            <h2 className="sec-title">See it in action</h2>
          </div>
          <div className="showcase">

            {/* Card 1: pixel-perfect highlighting */}
            <div className="show-card">
              <div className="sc-visual" style={{ overflow: 'hidden', background: '#f0eeea' }}>
                <div className="sc-bg-lines">
                  <i style={{ height: 9, width: '55%' }} />
                  <i style={{ height: 7, width: '80%' }} />
                  <i style={{ height: 7, width: '68%' }} />
                  <i style={{ height: 7, width: '73%' }} />
                </div>
                <div className="sc-widget-mock">
                  <div className="sc-widget-header">
                    <div className="sc-widget-header-left">
                      <div className="sc-widget-dot" />
                      <span className="sc-widget-name">Phaysr</span>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/></svg>
                  </div>
                  <div className="sc-widget-body">
                    <div className="sc-bubble-user">How do I invite my team?</div>
                    <div className="sc-bubble-ai">Go to <strong>Settings → Team</strong> and click <strong>"Invite member"</strong>. I'll highlight it for you.</div>
                    <div className="sc-status">
                      <div className="sc-status-dot" />
                      Highlighting element on page…
                    </div>
                  </div>
                  <div className="sc-input-bar">
                    <span className="sc-input-placeholder">Ask anything…</span>
                    <div className="sc-send-btn">
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              <h3>Pixel-perfect highlighting</h3>
              <p>Phaysr uses CSS selectors to pulse an animated ring around the exact element the user needs. It stays accurate after scrolling and survives layout changes.</p>
            </div>

            {/* Card 2: step-by-step guided flows */}
            <div className="show-card">
              <div className="sc-visual">
                <FlowCard />
              </div>
              <h3>Step-by-step guided flows</h3>
              <p>For multi-step tasks, Phaysr gives one instruction at a time. After each step it re-reads the live page and continues, up to six steps deep.</p>
            </div>

          </div>
        </section>

        {/* PRICING */}
        <div className="l-panel" id="pricing">
          <section className="l-section">
            <div className="sec-head">
              <span className="eyebrow"><span className="e-dot" />Pricing</span>
              <h2 className="sec-title">One plan. Everything included.</h2>
            </div>
            <div className="pricing-card">
              <div className="pricing-left">
                <div className="pricing-trial">7 days free</div>
                <div className="pricing-price"><span className="cur">$</span>0</div>
                <div className="pricing-then">then $29/mo</div>
                <Link className="cta-primary" to="/signup" style={{ padding: '14px 30px' }}>Start free trial</Link>
                <p className="pricing-note-sm">No credit card required. Cancel anytime.</p>
              </div>
              <div className="pricing-divider" />
              <ul className="pricing-feats">
                {[
                  ['One script tag setup',          'Paste one line and the widget is live. No SDK, no build step.'],
                  ['Sees the live page',             'Reads the DOM and takes a screenshot on every question.'],
                  ['Pixel-perfect highlighting',     'Pulses an animated ring around the exact element the user needs.'],
                  ['Step-by-step guided flows',      'Walks users through multi-step tasks one instruction at a time.'],
                  ['Feed it your docs',              'Point it at your FAQ or docs URL for product-specific answers.'],
                  ['Unlimited questions and sessions', 'No per-message limits or usage caps.'],
                ].map(([title, desc]) => (
                  <li key={title}>
                    <span className="pricing-check">
                      <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6.5 5 9l5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <span className="pf-desc">{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* CTA */}
        <section className="cta-sec" id="cta">
          <span className="eyebrow"><span className="e-dot" />Get started</span>
          <h2 className="sec-title" style={{ marginTop: 16 }}>7 days free. Live in <em>60&nbsp;seconds</em></h2>
          <p className="sec-sub">Create an account, paste one script tag, and your users get an AI guide that reads the live page and walks them through anything.</p>
          <div className="cta-actions">
            <Link className="cta-primary" to="/signup">Start free trial</Link>
            <a className="cta-ghost" href="https://demo.phaysr.com">See live demo</a>
          </div>
          <p className="cta-fine">7 days free, no credit card required. Then $29/mo, cancel anytime.</p>
        </section>

        {/* FOOTER */}
        <footer className="site-footer">
          <span className="f-brand">
            <BrandDots size={18} />
            Phaysr
          </span>
          <span>AI that sees your product and guides users through it.</span>
          <a href="mailto:jonah.alt@gmx.de" className="f-contact">Contact</a>
          <span>© 2026 Phaysr</span>
        </footer>

      </div>{/* /frame */}
    </div>
  );
}
