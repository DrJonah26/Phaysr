import { useState, useRef, useEffect } from 'react';

interface Member {
  name: string;
  email: string;
  role: string;
  initials: string;
}

const INITIAL_MEMBERS: Member[] = [
  { name: 'Jonah Davidson', email: 'jonah@acme.com', role: 'Owner',  initials: 'JD' },
  { name: 'Sarah Lee',      email: 'sarah@acme.com', role: 'Admin',  initials: 'SL' },
  { name: 'Marcus Chen',    email: 'marcus@acme.com',role: 'Member', initials: 'MC' },
  { name: 'Priya Patel',    email: 'priya@acme.com', role: 'Member', initials: 'PP' },
  { name: 'Tom Becker',     email: 'tom@acme.com',   role: 'Viewer', initials: 'TB' },
];

const ROLE_STYLES: Record<string, { bg: string; color: string; border: string; avatarBorder: string }> = {
  Owner:  { bg: 'rgba(156,89,89,0.10)', color: 'var(--accent)',  border: 'rgba(156,89,89,0.25)',   avatarBorder: 'rgba(156,89,89,0.30)' },
  Admin:  { bg: 'rgba(184,121,30,0.10)', color: 'var(--orange)', border: 'rgba(184,121,30,0.25)',  avatarBorder: 'rgba(184,121,30,0.30)' },
  Member: { bg: 'var(--elevated)',       color: 'var(--text-2)',  border: 'var(--border)',          avatarBorder: 'var(--border)' },
  Viewer: { bg: 'transparent',           color: 'var(--text-3)',  border: 'var(--border-subtle)',   avatarBorder: 'var(--border-subtle)' },
};

const ASSIGNABLE_ROLES = ['Admin', 'Member', 'Viewer'];

function MemberMenu({
  member,
  onChangeRole,
  onRemove,
  onClose,
}: {
  member: Member;
  onChangeRole: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      data-testid={`member-menu-${member.email}`}
      style={{
        position: 'absolute',
        right: 0,
        top: '100%',
        marginTop: 4,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(28,20,16,0.12)',
        minWidth: 160,
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      <button
        data-testid={`change-role-btn-${member.email}`}
        onClick={() => { onChangeRole(); onClose(); }}
        style={{
          display: 'block', width: '100%', textAlign: 'left',
          padding: '10px 14px', fontSize: 12, color: 'var(--text-1)',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'Figtree', system-ui",
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--elevated)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        Change role
      </button>
      {member.role !== 'Owner' && (
        <button
          data-testid={`remove-member-btn-${member.email}`}
          onClick={() => { onRemove(); onClose(); }}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '10px 14px', fontSize: 12, color: 'var(--red)',
            background: 'none', border: 'none', cursor: 'pointer',
            borderTop: '1px solid var(--border-subtle)',
            fontFamily: "'Figtree', system-ui",
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(180,50,50,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          Remove member
        </button>
      )}
    </div>
  );
}

export function Team() {
  const [members,      setMembers]      = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteEmail,  setInviteEmail]  = useState('');
  const [inviteRole,   setInviteRole]   = useState('Member');

  // dropdown open state per member email
  const [openMenu,     setOpenMenu]     = useState<string | null>(null);

  // role change modal
  const [roleTarget,   setRoleTarget]   = useState<Member | null>(null);
  const [newRole,      setNewRole]      = useState('');

  // remove confirm modal
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setMembers((prev) => [
      ...prev,
      { name: inviteEmail.split('@')[0], email: inviteEmail.trim(), role: inviteRole, initials: inviteEmail.slice(0, 2).toUpperCase() },
    ]);
    setInviteEmail('');
  };

  const openChangeRole = (member: Member) => {
    setRoleTarget(member);
    setNewRole(member.role === 'Owner' ? 'Admin' : member.role);
  };

  const confirmChangeRole = () => {
    if (!roleTarget || !newRole) return;
    setMembers((prev) => prev.map((m) => m.email === roleTarget.email ? { ...m, role: newRole } : m));
    setRoleTarget(null);
  };

  const openRemove = (member: Member) => {
    setRemoveTarget(member);
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    setMembers((prev) => prev.filter((m) => m.email !== removeTarget.email));
    setRemoveTarget(null);
  };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 760 }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 5px' }}>
          Team
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Manage members and their access</p>
      </header>

      {/* ── Invite ── */}
      <section className="card" style={{ padding: 24, marginBottom: 10 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 16px' }}>
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
          <button data-testid="invite-send-btn" className="btn-primary" onClick={handleInvite}>Send invite</button>
        </div>
      </section>

      {/* ── Members ── */}
      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
            Members
          </h2>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {members.length} total
          </span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {members.map((m, i) => {
            const rs = ROLE_STYLES[m.role] ?? ROLE_STYLES['Member'];
            return (
              <li
                key={m.email}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 24px',
                  borderBottom: i < members.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.1s',
                  position: 'relative',
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
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    data-testid={`member-options-${m.email}`}
                    onClick={() => setOpenMenu(openMenu === m.email ? null : m.email)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-3)', padding: 4,
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.1s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>

                  {openMenu === m.email && (
                    <MemberMenu
                      member={m}
                      onChangeRole={() => openChangeRole(m)}
                      onRemove={() => openRemove(m)}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Change role modal ── */}
      {roleTarget && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(20,15,12,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div
            data-testid="change-role-modal"
            className="card"
            style={{ padding: 28, width: 360, boxShadow: '0 16px 48px rgba(20,15,12,0.22)' }}
          >
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 4px' }}>
              Change role
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 20px' }}>
              Update access level for <strong style={{ color: 'var(--text-2)' }}>{roleTarget.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {ASSIGNABLE_ROLES.map((r) => {
                const sel = newRole === r;
                return (
                  <button
                    key={r}
                    data-testid={`role-option-${r.toLowerCase()}`}
                    onClick={() => setNewRole(r)}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: 7,
                      border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                      background: sel ? 'rgba(156,89,89,0.06)' : 'var(--elevated)',
                      cursor: 'pointer',
                      transition: 'border-color 0.1s, background 0.1s',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? 'var(--accent)' : 'var(--text-1)' }}>{r}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                data-testid="confirm-role-change-btn"
                className="btn-primary"
                onClick={confirmChangeRole}
              >
                Save changes
              </button>
              <button
                data-testid="cancel-role-change-btn"
                className="btn-ghost"
                onClick={() => setRoleTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove confirm modal ── */}
      {removeTarget && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(20,15,12,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div
            data-testid="remove-member-modal"
            className="card"
            style={{ padding: 28, width: 360, boxShadow: '0 16px 48px rgba(20,15,12,0.22)' }}
          >
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 4px' }}>
              Remove member
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 20px', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--text-2)' }}>{removeTarget.name}</strong> will lose access to all projects immediately. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                data-testid="confirm-remove-btn"
                onClick={confirmRemove}
                style={{
                  padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: 'rgba(180,50,50,0.12)', color: 'var(--red)',
                  border: '1px solid rgba(180,50,50,0.25)', cursor: 'pointer',
                  fontFamily: "'Figtree', system-ui",
                  transition: 'background 0.1s',
                }}
              >
                Remove
              </button>
              <button
                data-testid="cancel-remove-btn"
                className="btn-ghost"
                onClick={() => setRemoveTarget(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
