import { useState } from 'react';

const MEMBERS = [
  { name: 'Jonah Davidson', email: 'jonah@acme.com', role: 'Owner',  initials: 'JD' },
  { name: 'Sarah Lee',      email: 'sarah@acme.com', role: 'Admin',  initials: 'SL' },
  { name: 'Marcus Chen',    email: 'marcus@acme.com',role: 'Member', initials: 'MC' },
  { name: 'Priya Patel',    email: 'priya@acme.com', role: 'Member', initials: 'PP' },
  { name: 'Tom Becker',     email: 'tom@acme.com',   role: 'Viewer', initials: 'TB' },
];

const ROLE_STYLES: Record<string, { bg: string; color: string; border: string; avatarBorder: string }> = {
  Owner:  { bg: 'rgba(190,255,0,0.10)', color: 'var(--accent)',  border: 'rgba(190,255,0,0.22)',   avatarBorder: 'rgba(190,255,0,0.30)' },
  Admin:  { bg: 'rgba(255,153,0,0.10)', color: 'var(--orange)',  border: 'rgba(255,153,0,0.22)',   avatarBorder: 'rgba(255,153,0,0.30)' },
  Member: { bg: 'var(--elevated)',       color: 'var(--text-2)',  border: 'var(--border)',          avatarBorder: 'var(--border)' },
  Viewer: { bg: 'transparent',           color: 'var(--text-3)',  border: 'var(--border-subtle)',   avatarBorder: 'var(--border-subtle)' },
};

export function Team() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState('Member');

  return (
    <div style={{ padding: '40px 48px', maxWidth: 760 }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Syne', system-ui", fontSize: 28, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 5px' }}>
          Team
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Manage members and their access</p>
      </header>

      {/* ── Invite ── */}
      <section className="card" style={{ padding: 24, marginBottom: 10 }}>
        <h2 style={{ fontFamily: "'Syne', system-ui", fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 16px' }}>
          Invite member
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            data-testid="invite-email-input"
            className="field-input"
            style={{ flex: 1 }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            data-testid="invite-role-select"
            className="field-input"
            style={{ flex: '0 0 auto', width: 'auto', minWidth: 110 }}
          >
            <option>Admin</option>
            <option>Member</option>
            <option>Viewer</option>
          </select>
          <button data-testid="invite-send-btn" className="btn-primary">Send invite</button>
        </div>
      </section>

      {/* ── Members ── */}
      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontFamily: "'Syne', system-ui", fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
            Members
          </h2>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {MEMBERS.length} total
          </span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {MEMBERS.map((m, i) => {
            const rs = ROLE_STYLES[m.role] ?? ROLE_STYLES['Member'];
            return (
              <li
                key={m.email}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 24px',
                  borderBottom: i < MEMBERS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--elevated)',
                  border: `1px solid ${rs.avatarBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, fontWeight: 500, color: rs.color,
                  letterSpacing: '0.03em', flexShrink: 0,
                }}>
                  {m.initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{m.email}</div>
                </div>

                {/* Role badge */}
                <span style={{
                  padding: '3px 8px', borderRadius: 5,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
                  flexShrink: 0,
                }}>
                  {m.role}
                </span>

                {/* Options */}
                <button style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', padding: 4,
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.1s',
                  flexShrink: 0,
                }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

    </div>
  );
}
