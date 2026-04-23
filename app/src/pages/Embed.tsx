import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, type Project } from '../api';

const WIDGET_SRC = 'https://cdn.phaysr.ai/widget.js';

export default function Embed() {
  const { user, signout } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  if (loading || !project) return null;

  const snippet = `<script\n  src="${WIDGET_SRC}"\n  data-api-key="${project.apiKey}"\n  defer\n></script>`;

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
          <div className="success-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Widget configured for <strong style={{ marginLeft: 4 }}>{project.siteName}</strong>
          </div>

          <h1>Your embed code is <em>ready</em></h1>
          <p className="sub">Paste this snippet into your app and the widget is live — no other setup needed.</p>

          <div className="code-block-wrap">
            <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              <span className="kw">{'<script'}</span>{'\n'}
              {'  '}<span className="attr">src</span>=<span className="val">"{WIDGET_SRC}"</span>{'\n'}
              {'  '}<span className="attr">data-api-key</span>=<span className="val">"{project.apiKey}"</span>{'\n'}
              {'  '}<span className="kw">defer</span>{'\n'}
              <span className="kw">{'></script>'}</span>
            </pre>
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
                Works with any framework — Next.js, Vue, plain HTML, WordPress.
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
        </div>
      </div>
    </>
  );
}
