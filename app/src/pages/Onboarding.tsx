import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api';

type KnowledgeTab = 'url' | 'paste';

export default function Onboarding() {
  const { user, signout } = useAuth();
  const nav = useNavigate();

  const [siteName, setSiteName] = useState('');
  const [color, setColor] = useState('#9C5959');
  const [allowedDomain, setAllowedDomain] = useState('');
  const [tab, setTab] = useState<KnowledgeTab>('url');
  const [contextUrl, setContextUrl] = useState('');
  const [contextText, setContextText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleColorInput(val: string) {
    setColor(val);
  }

  function handleHexInput(val: string) {
    const hex = val.startsWith('#') ? val : '#' + val;
    setColor(hex);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!siteName.trim()) {
      setError('Please enter your website name.');
      return;
    }
    setLoading(true);
    try {
      const { project } = await api.projects.create({
        siteName: siteName.trim(),
        color,
        allowedDomain: allowedDomain.trim() || undefined,
        context: tab === 'paste' ? contextText : undefined,
        contextUrl: tab === 'url' ? contextUrl : undefined,
      });
      nav(`/embed?id=${project.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="app-nav">
        <a href="/" className="app-nav-logo">Phays<span>r</span></a>
        <div className="app-nav-actions">
          <span style={{ fontSize: 14, color: 'var(--ink2)' }}>{user?.email}</span>
          <button className="btn-ghost" onClick={signout} style={{ padding: '7px 14px', fontSize: 13 }}>Sign out</button>
        </div>
      </nav>

      <div className="onboarding-wrap">
        <div className="onboarding-card">
          <h1>Set up your widget</h1>
          <p>You'll get a script tag to paste into your app.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit} noValidate>
            <div className="field">
              <label>Website / product name</label>
              <input
                type="text"
                placeholder="e.g. Acme, TaskFlow, BillingPro"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label>Your domain <span style={{ color: 'var(--ink2)', fontWeight: 400 }}>(only this domain can use your widget)</span></label>
              <input
                type="text"
                placeholder="app.yourproduct.com"
                value={allowedDomain}
                onChange={(e) => setAllowedDomain(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Brand color</label>
              <div className="color-row">
                <div className="color-swatch-wrap">
                  <div className="color-swatch" style={{ background: color }} />
                  <input
                    type="color"
                    className="color-native"
                    value={color}
                    onChange={(e) => handleColorInput(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  className="color-hex-input"
                  value={color}
                  onChange={(e) => handleHexInput(e.target.value)}
                  maxLength={7}
                  placeholder="#9C5959"
                />
              </div>
            </div>

            <div className="divider" />

            <div className="field">
              <label>Knowledge source <span style={{ color: 'var(--ink2)', fontWeight: 400 }}>(optional, helps AI answer product-specific questions)</span></label>
              <div className="tabs">
                <button
                  type="button"
                  className={`tab-btn${tab === 'url' ? ' active' : ''}`}
                  onClick={() => setTab('url')}
                >
                  Link to docs / FAQ
                </button>
                <button
                  type="button"
                  className={`tab-btn${tab === 'paste' ? ' active' : ''}`}
                  onClick={() => setTab('paste')}
                >
                  Paste text
                </button>
              </div>

              {tab === 'url' ? (
                <input
                  type="url"
                  placeholder="https://docs.yourproduct.com/faq"
                  value={contextUrl}
                  onChange={(e) => setContextUrl(e.target.value)}
                />
              ) : (
                <textarea
                  rows={7}
                  placeholder="Paste your FAQ, help docs, or any text you want the AI to know about your product…"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                />
              )}
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading && <span className="spinner" />}
              {loading ? 'Creating…' : 'Generate my embed code →'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
