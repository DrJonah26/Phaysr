import { useState } from 'react';

export function Settings() {
  const [name,             setName]             = useState('Jonah Davidson');
  const [email,            setEmail]            = useState('jonah@acme.com');
  const [notifications,    setNotifications]    = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw,        setCurrentPw]        = useState('');
  const [newPw,            setNewPw]            = useState('');
  const [confirmPw,        setConfirmPw]        = useState('');

  const handlePasswordSave = () => {
    if (!currentPw || !newPw || newPw !== confirmPw) return;
    setShowPasswordForm(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const sectionTitle = (text: string) => (
    <h2 style={{ fontFamily: "'Syne', system-ui", fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
      {text}
    </h2>
  );

  return (
    <div style={{ padding: '40px 48px', maxWidth: 640 }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Syne', system-ui", fontSize: 28, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 5px' }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Manage your account preferences</p>
      </header>

      {/* ── Profile ── */}
      <section className="card" style={{ padding: 24, marginBottom: 10 }}>
        <div style={{ marginBottom: 18 }}>{sectionTitle('Profile')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="field-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="profile-name-input"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="profile-email-input"
              className="field-input"
            />
          </div>
          <div>
            <button data-testid="save-profile-btn" className="btn-primary">Save changes</button>
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="card" style={{ padding: 24, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {sectionTitle('Security')}
          {!showPasswordForm && (
            <button
              data-testid="change-password-btn"
              onClick={() => setShowPasswordForm(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--accent)',
                fontFamily: "'Figtree', system-ui", fontWeight: 500, padding: 0,
              }}
            >
              Change password
            </button>
          )}
        </div>
        {!showPasswordForm ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            Password last changed 3 months ago.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">Current password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} data-testid="current-password-input" className="field-input" />
            </div>
            <div>
              <label className="field-label">New password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} data-testid="new-password-input" className="field-input" />
            </div>
            <div>
              <label className="field-label">Confirm new password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} data-testid="confirm-password-input" className="field-input" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button data-testid="save-password-btn" className="btn-primary" onClick={handlePasswordSave}>Update password</button>
              <button data-testid="cancel-password-btn" className="btn-ghost" onClick={() => { setShowPasswordForm(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Notifications ── */}
      <section className="card" style={{ padding: 24, marginBottom: 10 }}>
        <div style={{ marginBottom: 16 }}>{sectionTitle('Notifications')}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Email notifications</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Get updates about your projects</div>
          </div>
          <button
            onClick={() => setNotifications((n) => !n)}
            data-testid="notifications-toggle"
            style={{
              position: 'relative',
              width: 42, height: 22,
              borderRadius: 11,
              background: notifications ? 'var(--accent)' : 'var(--elevated)',
              border: `1px solid ${notifications ? 'transparent' : 'var(--border)'}`,
              cursor: 'pointer',
              transition: 'background 0.15s',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 2, left: notifications ? 20 : 2,
              width: 16, height: 16,
              borderRadius: '50%',
              background: notifications ? '#0C0C0F' : 'var(--text-3)',
              transition: 'left 0.15s',
            }} />
          </button>
        </div>
      </section>

      {/* ── Plan ── */}
      <section style={{
        padding: 24,
        borderRadius: 10,
        border: '1px solid rgba(190,255,0,0.2)',
        background: 'rgba(190,255,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {sectionTitle('Current plan')}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, fontWeight: 500,
                padding: '2px 7px',
                background: 'var(--elevated)',
                color: 'var(--text-2)',
                borderRadius: 4,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                border: '1px solid var(--border)',
              }}>Free</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.65 }}>
              Upgrade to Pro for unlimited projects, advanced analytics, and priority support.
            </p>
          </div>
          <button data-testid="upgrade-plan-btn" className="btn-primary" style={{ marginTop: 2, flexShrink: 0 }}>
            Upgrade to Pro
          </button>
        </div>
      </section>

    </div>
  );
}
