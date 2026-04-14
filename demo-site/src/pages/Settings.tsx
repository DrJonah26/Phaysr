import { useState } from 'react';

const BACKUP_CODES = [
  'A3F7-K92M', 'B8X1-P54N', 'C6Q2-W38J', 'D9R5-L71H',
  'E2T4-Z86G', 'F5Y9-V13D', 'G7U0-S47C', 'H1W6-N60B',
];

export function Settings() {
  const [name,             setName]             = useState('Jonah Davidson');
  const [email,            setEmail]            = useState('jonah@acme.com');
  const [notifications,    setNotifications]    = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw,        setCurrentPw]        = useState('');
  const [newPw,            setNewPw]            = useState('');
  const [confirmPw,        setConfirmPw]        = useState('');

  // 2FA state: 'off' | 'scan' | 'verify' | 'codes' | 'enabled'
  const [twoFaStep, setTwoFaStep] = useState<'off' | 'scan' | 'verify' | 'codes' | 'enabled'>('off');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState(false);

  const handlePasswordSave = () => {
    if (!currentPw || !newPw || newPw !== confirmPw) return;
    setShowPasswordForm(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const handleVerify2FA = () => {
    // accept any 6-digit code for demo purposes
    if (/^\d{6}$/.test(verifyCode)) {
      setVerifyError(false);
      setVerifyCode('');
      setTwoFaStep('codes');
    } else {
      setVerifyError(true);
    }
  };

  const sectionTitle = (text: string) => (
    <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
      {text}
    </h2>
  );

  return (
    <div style={{ padding: '40px 48px', maxWidth: 640 }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 5px' }}>
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

      {/* ── Two-factor authentication ── */}
      <section className="card" style={{ padding: 24, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          {sectionTitle('Two-factor authentication')}
          {twoFaStep === 'enabled' && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, padding: '2px 7px',
              background: 'rgba(45,122,82,0.10)', color: 'var(--green)',
              borderRadius: 4, border: '1px solid rgba(45,122,82,0.22)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>Enabled</span>
          )}
        </div>

        {/* Step: off */}
        {twoFaStep === 'off' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 14px', lineHeight: 1.65 }}>
              Add an extra layer of security by requiring a verification code from your authenticator app when you sign in.
            </p>
            <button
              data-testid="enable-2fa-btn"
              className="btn-primary"
              onClick={() => setTwoFaStep('scan')}
            >
              Enable 2FA
            </button>
          </div>
        )}

        {/* Step 1: scan QR */}
        {twoFaStep === 'scan' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 16px', lineHeight: 1.65 }}>
              <strong>Step 1 of 3</strong> — Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy).
            </p>
            {/* Fake QR code */}
            <div
              data-testid="2fa-qr-code"
              style={{
                width: 140, height: 140,
                background: 'var(--elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                padding: 12,
                gap: 2,
                marginBottom: 16,
              }}
            >
              {/* Decorative QR-like grid */}
              {Array.from({ length: 49 }, (_, idx) => {
                const filled = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,29,30,31,32,33,34,40,41,42,43,44,45,46,47,48,8,15,22,9,10,11,16,23,35,36,37].includes(idx);
                return (
                  <div key={idx} style={{
                    background: filled ? 'var(--text-1)' : 'transparent',
                    borderRadius: 1,
                  }} />
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 16px' }}>
              Can't scan? Use the setup key: <code style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>JBSW Y3DP EHPK 3PXP</code>
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button data-testid="2fa-scanned-btn" className="btn-primary" onClick={() => setTwoFaStep('verify')}>
                I've scanned the code
              </button>
              <button data-testid="2fa-cancel-scan-btn" className="btn-ghost" onClick={() => setTwoFaStep('off')}>Cancel</button>
            </div>
          </div>
        )}

        {/* Step 2: verify code */}
        {twoFaStep === 'verify' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 16px', lineHeight: 1.65 }}>
              <strong>Step 2 of 3</strong> — Enter the 6-digit code from your authenticator app to confirm setup.
            </p>
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Verification code</label>
              <input
                type="text"
                placeholder="000 000"
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify2FA()}
                data-testid="2fa-verify-input"
                className="field-input"
                maxLength={6}
                style={{ letterSpacing: '0.2em', fontFamily: "'JetBrains Mono', monospace", fontSize: 18, width: 140, textAlign: 'center' }}
              />
              {verifyError && (
                <p style={{ fontSize: 11, color: 'var(--red)', margin: '6px 0 0' }}>
                  Invalid code — enter the 6-digit code shown in your app.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button data-testid="2fa-verify-btn" className="btn-primary" onClick={handleVerify2FA}>Verify</button>
              <button data-testid="2fa-back-to-scan-btn" className="btn-ghost" onClick={() => setTwoFaStep('scan')}>Back</button>
            </div>
          </div>
        )}

        {/* Step 3: backup codes */}
        {twoFaStep === 'codes' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 6px', lineHeight: 1.65 }}>
              <strong>Step 3 of 3</strong> — Save these backup codes somewhere safe. Each code can only be used once if you lose access to your app.
            </p>
            <p style={{ fontSize: 11, color: 'var(--red)', margin: '0 0 14px' }}>
              You won't be able to see these again.
            </p>
            <div
              data-testid="2fa-backup-codes"
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 6, marginBottom: 18,
                background: 'var(--elevated)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 16,
              }}
            >
              {BACKUP_CODES.map((code) => (
                <span
                  key={code}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, color: 'var(--text-1)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {code}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                data-testid="2fa-done-btn"
                className="btn-primary"
                onClick={() => setTwoFaStep('enabled')}
              >
                Done — I've saved my codes
              </button>
            </div>
          </div>
        )}

        {/* Enabled state */}
        {twoFaStep === 'enabled' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 14px', lineHeight: 1.65 }}>
              Your account is protected with two-factor authentication. You'll need your authenticator app each time you sign in.
            </p>
            <button
              data-testid="disable-2fa-btn"
              className="btn-ghost"
              style={{ fontSize: 12, color: 'var(--red)', borderColor: 'rgba(180,50,50,0.25)' }}
              onClick={() => setTwoFaStep('off')}
            >
              Disable 2FA
            </button>
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
              background: notifications ? '#FFFFFF' : 'var(--text-3)',
              transition: 'left 0.15s',
            }} />
          </button>
        </div>
      </section>

      {/* ── Plan ── */}
      <section style={{
        padding: 24,
        borderRadius: 10,
        border: '1px solid rgba(156,89,89,0.25)',
        background: 'rgba(156,89,89,0.04)',
        boxShadow: '0 1px 3px rgba(28,20,16,0.04)',
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
