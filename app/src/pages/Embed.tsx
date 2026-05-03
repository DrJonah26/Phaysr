import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, type Project } from '../api';

const WIDGET_SRC = 'https://cdn.phaysr.com/widget.js';
const BACKEND_URL = 'https://api.phaysr.com';

export default function Embed() {
  const { user, signout } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive'>(
    user?.subscriptionStatus ?? 'inactive'
  );

  useEffect(() => {
    api.projects.list().then(({ projects }) => {
      if (projects.length === 0) {
        nav('/onboarding', { replace: true });
        return;
      }
      const id = params.get('id');
      const p = id ? (projects.find((x) => x.id === id) ?? projects[0]) : projects[0];
      setProject(p);
    }).catch(() => {
      nav('/onboarding', { replace: true });
    }).finally(() => setLoading(false));
  }, [nav, params]);

  // Handle return from Stripe checkout
  useEffect(() => {
    if (params.get('checkout') !== 'success') return;
    setActivating(true);
    // Remove the param from URL without re-render loop
    const next = new URLSearchParams(params);
    next.delete('checkout');
    setParams(next, { replace: true });

    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const { user: u } = await api.auth.me();
        if (u?.subscriptionStatus === 'active') {
          setSubscriptionStatus('active');
          setActivating(false);
          clearInterval(poll);
        }
      } catch { /* ignore */ }
      if (attempts >= 10) {
        setActivating(false);
        clearInterval(poll);
      }
    }, 1000);

    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleActivate = useCallback(async () => {
    if (!project) return;
    setCheckoutLoading(true);
    try {
      const { url } = await api.billing.createCheckout(project.id);
      window.location.href = url!;
    } catch {
      setCheckoutLoading(false);
    }
  }, [project]);

  if (loading || !project) return null;

  const isActive = subscriptionStatus === 'active';

  const snippet = `<script\n  src="${WIDGET_SRC}"\n  data-api-key="${project.apiKey}"\n  data-site-name="${project.siteName}"\n  data-color="${project.color}"\n  data-backend-url="${BACKEND_URL}"\n  defer\n></script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <>
      <nav className="app-nav">
        <a href="http://localhost:5173" className="app-nav-logo">Phays<span>r</span></a>
        <div className="app-nav-actions">
          <span style={{ fontSize: 14, color: 'var(--ink2)' }}>{user?.email}</span>
          <button className="btn-ghost" onClick={() => nav('/onboarding')} style={{ padding: '7px 14px', fontSize: 13 }}>+ New project</button>
          <button className="btn-ghost" onClick={signout} style={{ padding: '7px 14px', fontSize: 13 }}>Sign out</button>
        </div>
      </nav>

      <div className="embed-wrap">
        <div className="embed-card">
          {isActive && (
            <div className="success-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Widget configured for <strong style={{ marginLeft: 4 }}>{project.siteName}</strong>
            </div>
          )}

          <h1>Your embed code is <em>ready</em></h1>
          <p className="sub">Paste this snippet into your app and the widget goes live. No other setup needed.</p>

          {/* Code block — blurred when not subscribed */}
          <div className="code-block-outer">
            <div className={`code-block-wrap${isActive ? '' : ' code-blurred'}`}>
              {isActive && (
                <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              )}
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                <span className="kw">{'<script'}</span>{'\n'}
                {'  '}<span className="attr">src</span>=<span className="val">"{WIDGET_SRC}"</span>{'\n'}
                {'  '}<span className="attr">data-api-key</span>=<span className="val">"{project.apiKey}"</span>{'\n'}
                {'  '}<span className="attr">data-site-name</span>=<span className="val">"{project.siteName}"</span>{'\n'}
                {'  '}<span className="attr">data-color</span>=<span className="val">"{project.color}"</span>{'\n'}
                {'  '}<span className="attr">data-backend-url</span>=<span className="val">"{BACKEND_URL}"</span>{'\n'}
                {'  '}<span className="kw">defer</span>{'\n'}
                <span className="kw">{'></script>'}</span>
              </pre>
            </div>

            {!isActive && (
              <div className="paywall-overlay">
                {activating ? (
                  <>
                    <span className="spinner" style={{ borderColor: 'rgba(156,89,89,0.3)', borderTopColor: 'var(--accent)' }} />
                    <p className="paywall-activating">Activating your account…</p>
                  </>
                ) : (
                  <>
                    <div className="paywall-lock">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <p className="paywall-price">€49<span>/mo</span></p>
                    <button className="btn-primary paywall-btn" onClick={handleActivate} disabled={checkoutLoading}>
                      {checkoutLoading && <span className="spinner" />}
                      {checkoutLoading ? 'Redirecting…' : 'Activate Phaysr →'}
                    </button>
                    <p className="paywall-note">Cancel anytime.</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="embed-steps">
            <div className="embed-step">
              <div className="embed-step-num">Step 01</div>
              <h3>Copy the snippet</h3>
              <p>Click "Copy" above to copy the script tag to your clipboard.</p>
            </div>
            <div className="embed-step">
              <div className="embed-step-num">Step 02</div>
              <h3>Paste before <code>{'</body>'}</code></h3>
              <p>
                In your app's HTML, paste the snippet just before the closing <code>{'</body>'}</code> tag.
                Works with any framework: Next.js, Vue, plain HTML, WordPress.
              </p>
            </div>
            <div className="embed-step">
              <div className="embed-step-num">Step 03</div>
              <h3>Save & reload</h3>
              <p>Deploy your change or reload the dev server. The Phaysr bubble will appear in the bottom-right corner.</p>
            </div>
            <div className="embed-step">
              <div className="embed-step-num">Step 04</div>
              <h3>Test it live</h3>
              <p>Open the bubble, ask a question about your product. The AI should highlight the exact element you need.</p>
            </div>
          </div>

          {isActive && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href={`http://localhost:5173?api_key=${project.apiKey}`}
                className="btn-primary"
                style={{ width: 'auto' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Test on demo site →
              </a>
              <button className="btn-ghost" onClick={() => nav('/onboarding')}>
                Update configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
