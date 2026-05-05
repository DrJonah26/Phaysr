import { useState, useEffect, type ReactNode } from 'react';
import './demo-app.css';

type Page = 'dashboard' | 'settings' | 'billing' | 'team';

const IconGrid = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>;
const IconSettings = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconCard = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IconTeam = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const NAV: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconGrid /> },
  { id: 'settings',  label: 'Settings',  icon: <IconSettings /> },
  { id: 'billing',   label: 'Billing',   icon: <IconCard /> },
  { id: 'team',      label: 'Team',      icon: <IconTeam /> },
];

// ── MODAL ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal" onClick={e => e.stopPropagation()}>
        <div className="dm-modal-header">
          <span className="dm-modal-title">{title}</span>
          <button className="dm-modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Software');
  const [projectPriority, setProjectPriority] = useState('Medium');
  const [created, setCreated] = useState(false);

  const [projects, setProjects] = useState([
    { name: 'Website Redesign', type: 'Design',   progress: 57 },
    { name: 'API v2 Migration', type: 'Software', progress: 75 },
    { name: 'Q2 Marketing Push',type: 'Marketing',progress: 40 },
  ]);

  function handleCreate() {
    if (!projectName.trim()) return;
    setProjects(p => [...p, { name: projectName, type: projectType, progress: 0 }]);
    setCreated(true);
    setTimeout(() => { setShowNewProject(false); setCreated(false); setProjectName(''); }, 1200);
  }

  return (
    <div className="dm-content">
      <div className="dm-page-header">
        <div>
          <h1 className="dm-page-title">Dashboard</h1>
          <p className="dm-page-sub">Overview of your workspace</p>
        </div>
        <button className="dm-btn-primary" data-testid="new-project-btn" onClick={() => setShowNewProject(true)}>
          + New project
        </button>
      </div>

      <div className="dm-stats">
        {[
          { label: 'Tasks Completed', value: '247', change: '+18 today' },
          { label: 'Open Issues',     value: '5',   change: '−3 this week' },
          { label: 'Active Projects', value: String(projects.length), change: '+2 this week' },
          { label: 'Team Members',    value: '8',   change: '+1 this month' },
        ].map(s => (
          <div key={s.label} className="dm-stat-card">
            <div className="dm-stat-label">{s.label}</div>
            <div className="dm-stat-value">{s.value}</div>
            <div className="dm-stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="dm-section-title">Recent Projects</div>
      <div className="dm-table">
        {projects.map(p => (
          <div key={p.name} className="dm-table-row">
            <div className="dm-table-name">
              <span className="dm-dot" />
              <div>
                <div className="dm-row-title">{p.name}</div>
                <div className="dm-row-sub">{p.type}</div>
              </div>
            </div>
            <div className="dm-progress-wrap">
              <div className="dm-progress-bar">
                <div className="dm-progress-fill" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="dm-progress-label">{p.progress}%</span>
            </div>
            <div className="dm-row-actions">
              <button className="dm-btn-ghost-sm" data-testid={`open-${p.name.toLowerCase().replace(/ /g,'-')}`}>Open</button>
            </div>
          </div>
        ))}
      </div>

      {showNewProject && (
        <Modal title="Create New Project" onClose={() => setShowNewProject(false)}>
          {created ? (
            <div className="dm-modal-success">✓ Project created!</div>
          ) : (
            <div className="dm-modal-body">
              <div className="dm-field">
                <label className="dm-field-label">Project name</label>
                <input
                  className="dm-input"
                  placeholder="e.g. Mobile App Redesign"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  data-testid="project-name-input"
                  autoFocus
                />
              </div>
              <div className="dm-field">
                <label className="dm-field-label">Type</label>
                <select className="dm-input" value={projectType} onChange={e => setProjectType(e.target.value)} data-testid="project-type-select">
                  <option>Software</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Research</option>
                </select>
              </div>
              <div className="dm-field">
                <label className="dm-field-label">Priority</label>
                <select className="dm-input" value={projectPriority} onChange={e => setProjectPriority(e.target.value)} data-testid="project-priority-select">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div className="dm-modal-footer">
                <button className="dm-btn-ghost" onClick={() => setShowNewProject(false)}>Cancel</button>
                <button className="dm-btn-primary" onClick={handleCreate} data-testid="create-project-btn">Create project</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── SETTINGS ───────────────────────────────────────────────────────────────
function Settings({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [name, setName] = useState('Jonah D.');
  const [email, setEmail] = useState('jonah@acme.com');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [slackNotifs, setSlackNotifs] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="dm-content">
      <div className="dm-page-header">
        <div>
          <h1 className="dm-page-title">Settings</h1>
          <p className="dm-page-sub">Manage your account preferences</p>
        </div>
      </div>

      <div className="dm-card dm-settings-card">
        <div className="dm-settings-group">
          <div className="dm-settings-group-title">Profile</div>
          <div className="dm-field">
            <label className="dm-field-label">Full name</label>
            <input className="dm-input" value={name} onChange={e => setName(e.target.value)} data-testid="settings-name" />
          </div>
          <div className="dm-field">
            <label className="dm-field-label">Email address</label>
            <input className="dm-input" value={email} onChange={e => setEmail(e.target.value)} data-testid="settings-email" />
          </div>
        </div>

        <div className="dm-settings-group">
          <div className="dm-settings-group-title">Notifications</div>
          <label className="dm-toggle-row">
            <input type="checkbox" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} data-testid="toggle-email-notifs" />
            <span>Email notifications</span>
          </label>
          <label className="dm-toggle-row">
            <input type="checkbox" checked={slackNotifs} onChange={e => setSlackNotifs(e.target.checked)} data-testid="toggle-slack-notifs" />
            <span>Slack notifications</span>
          </label>
        </div>

        <div className="dm-settings-group">
          <div className="dm-settings-group-title">Subscription</div>
          <div className="dm-plan-row">
            <div>
              <div className="dm-row-title">Pro Plan — $29/mo</div>
              <div className="dm-row-sub">Renews May 1, 2026</div>
            </div>
            <button
              className="dm-btn-primary"
              data-testid="upgrade-btn"
              onClick={() => onNavigate('billing')}
            >
              Upgrade plan
            </button>
          </div>
        </div>

        <div className="dm-settings-footer">
          <button className="dm-btn-primary" onClick={handleSave} data-testid="save-settings-btn">
            {saved ? '✓ Saved!' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BILLING ────────────────────────────────────────────────────────────────
function Billing() {
  const [selected, setSelected] = useState<'pro' | 'enterprise'>('pro');
  const [confirmed, setConfirmed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleUpgrade() {
    setConfirmed(true);
    setTimeout(() => { setShowConfirm(false); setConfirmed(false); }, 1500);
  }

  return (
    <div className="dm-content">
      <div className="dm-page-header">
        <div>
          <h1 className="dm-page-title">Billing</h1>
          <p className="dm-page-sub">Manage your subscription and invoices</p>
        </div>
      </div>

      <div className="dm-section-title">Choose a plan</div>
      <div className="dm-plans-grid">
        <div
          className={`dm-plan-card${selected === 'pro' ? ' selected' : ''}`}
          onClick={() => setSelected('pro')}
          data-testid="plan-pro"
        >
          <div className="dm-plan-name">Pro</div>
          <div className="dm-plan-price">$29<span>/mo</span></div>
          <ul className="dm-plan-features">
            <li>Up to 20 members</li>
            <li>Unlimited projects</li>
            <li>Email support</li>
          </ul>
        </div>
        <div
          className={`dm-plan-card dm-plan-card--highlight${selected === 'enterprise' ? ' selected' : ''}`}
          onClick={() => setSelected('enterprise')}
          data-testid="plan-enterprise"
        >
          <div className="dm-plan-badge">Most popular</div>
          <div className="dm-plan-name">Enterprise</div>
          <div className="dm-plan-price">$99<span>/mo</span></div>
          <ul className="dm-plan-features">
            <li>Unlimited members</li>
            <li>Unlimited projects</li>
            <li>Priority support</li>
            <li>Advanced analytics</li>
            <li>SSO + custom roles</li>
          </ul>
        </div>
      </div>

      <button
        className="dm-btn-primary"
        style={{ marginTop: 20 }}
        data-testid="confirm-plan-btn"
        onClick={() => setShowConfirm(true)}
      >
        Confirm — {selected === 'pro' ? 'Pro $29/mo' : 'Enterprise $99/mo'}
      </button>

      <div className="dm-section-title" style={{ marginTop: 36 }}>Recent Invoices</div>
      <div className="dm-table">
        {[
          { date: 'Apr 1, 2026', amount: '$29.00', status: 'Paid' },
          { date: 'Mar 1, 2026', amount: '$29.00', status: 'Paid' },
          { date: 'Feb 1, 2026', amount: '$29.00', status: 'Paid' },
        ].map(inv => (
          <div key={inv.date} className="dm-table-row">
            <span className="dm-row-title">{inv.date}</span>
            <span className="dm-row-sub">{inv.amount}</span>
            <span className="dm-badge dm-badge-green">{inv.status}</span>
          </div>
        ))}
      </div>

      {showConfirm && (
        <Modal title="Confirm Plan Change" onClose={() => setShowConfirm(false)}>
          {confirmed ? (
            <div className="dm-modal-success">✓ Plan updated!</div>
          ) : (
            <div className="dm-modal-body">
              <p className="dm-modal-text">
                You're switching to <strong>{selected === 'enterprise' ? 'Enterprise ($99/mo)' : 'Pro ($29/mo)'}</strong>.
                Your card on file will be charged at the next billing cycle.
              </p>
              <div className="dm-modal-footer">
                <button className="dm-btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="dm-btn-primary" onClick={handleUpgrade} data-testid="confirm-upgrade-btn">Confirm upgrade</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── TEAM ───────────────────────────────────────────────────────────────────
function Team() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [invited, setInvited] = useState(false);
  const [members, setMembers] = useState([
    { name: 'Jonah D.',    email: 'jonah@acme.com',  role: 'Owner',  initials: 'JD' },
    { name: 'Sarah Lee',   email: 'sarah@acme.com',  role: 'Admin',  initials: 'SL' },
    { name: 'Marcus Chen', email: 'marcus@acme.com', role: 'Member', initials: 'MC' },
    { name: 'Priya Patel', email: 'priya@acme.com',  role: 'Member', initials: 'PP' },
  ]);

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInvited(true);
    setTimeout(() => {
      setMembers(m => [...m, {
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        initials: inviteEmail.slice(0, 2).toUpperCase(),
      }]);
      setShowInvite(false);
      setInvited(false);
      setInviteEmail('');
    }, 1200);
  }

  return (
    <div className="dm-content">
      <div className="dm-page-header">
        <div>
          <h1 className="dm-page-title">Team</h1>
          <p className="dm-page-sub">{members.length} members</p>
        </div>
        <button className="dm-btn-primary" data-testid="invite-btn" onClick={() => setShowInvite(true)}>
          + Invite member
        </button>
      </div>

      <div className="dm-table">
        {members.map(m => (
          <div key={m.email} className="dm-table-row">
            <div className="dm-table-name">
              <div className="dm-avatar">{m.initials}</div>
              <div>
                <div className="dm-row-title">{m.name}</div>
                <div className="dm-row-sub">{m.email}</div>
              </div>
            </div>
            <span className="dm-badge">{m.role}</span>
            {m.role !== 'Owner' && (
              <button className="dm-btn-ghost-sm" data-testid={`remove-${m.initials.toLowerCase()}`}>Remove</button>
            )}
          </div>
        ))}
      </div>

      {showInvite && (
        <Modal title="Invite Team Member" onClose={() => setShowInvite(false)}>
          {invited ? (
            <div className="dm-modal-success">✓ Invite sent!</div>
          ) : (
            <div className="dm-modal-body">
              <div className="dm-field">
                <label className="dm-field-label">Email address</label>
                <input
                  className="dm-input"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  data-testid="invite-email-input"
                  autoFocus
                />
              </div>
              <div className="dm-field">
                <label className="dm-field-label">Role</label>
                <select className="dm-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)} data-testid="invite-role-select">
                  <option>Member</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="dm-modal-footer">
                <button className="dm-btn-ghost" onClick={() => setShowInvite(false)}>Cancel</button>
                <button className="dm-btn-primary" onClick={handleInvite} data-testid="send-invite-btn">Send invite</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Dashboard',
  settings: 'Settings',
  billing: 'Billing',
  team: 'Team',
};

// ── APP ────────────────────────────────────────────────────────────────────
export function DemoApp() {
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    if (document.querySelector('script[data-widget="ai-buddy"]')) return;
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.setAttribute('data-widget', 'ai-buddy');
    script.setAttribute('data-api-key', 'demo_local');
    script.setAttribute('data-site-name', 'Acme');
    script.setAttribute('data-color', '#9C5959');
    script.setAttribute('data-backend-url', 'https://api.phaysr.com');
    script.setAttribute('data-context-url', 'https://demo.phaysr.com/faq.txt');
    script.setAttribute('data-show-welcome', 'true');
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="demo-root">
      <div className="dm-banner">
        <span className="dm-banner-text">This is the demo of Phaysr</span>
        <a href="https://phaysr.com" className="dm-banner-cta" target="_blank" rel="noopener noreferrer">
          Get started
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div className="dm-shell">
      <aside className="dm-sidebar">
        <div className="dm-logo">
          <div className="dm-logo-icon">A</div>
          <span className="dm-logo-name">Acme</span>
        </div>
        <nav className="dm-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              data-testid={`nav-${item.id}`}
              className={`dm-nav-item${page === item.id ? ' active' : ''}`}
            >
              <span className="dm-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="dm-user">
          <div className="dm-user-avatar">JD</div>
          <div>
            <div className="dm-user-name">Jonah D.</div>
            <div className="dm-user-email">jonah@acme.com</div>
          </div>
        </div>
      </aside>
      <main className="dm-main">
        <div className="dm-topbar">
          <span className="dm-topbar-title">{PAGE_LABELS[page]}</span>
        </div>
        <div className="dm-scroll">
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page === 'settings'  && <Settings  onNavigate={setPage} />}
          {page === 'billing'   && <Billing />}
          {page === 'team'      && <Team />}
        </div>
      </main>
      </div>
    </div>
  );
}
