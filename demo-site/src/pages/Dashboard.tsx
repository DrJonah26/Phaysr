import { useState } from 'react';

const STATS = [
  { label: 'Active Projects', value: '12',  change: '+2 this week',  up: true },
  { label: 'Team Members',    value: '8',   change: '+1 this month', up: true },
  { label: 'Tasks Completed', value: '247', change: '+18 today',     up: true },
  { label: 'Open Issues',     value: '5',   change: '−3 this week',  up: true },
];

const ACTIVITY = [
  { user: 'Sarah Lee',    action: 'closed issue #142',    time: '2m ago',  initials: 'SL' },
  { user: 'Marcus Chen',  action: 'pushed to main',        time: '12m ago', initials: 'MC' },
  { user: 'Priya Patel',  action: 'commented on PR #88',   time: '1h ago',  initials: 'PP' },
  { user: 'Tom Becker',   action: 'created Project Atlas', time: '3h ago',  initials: 'TB' },
  { user: 'Sarah Lee',    action: 'invited a new member',  time: '5h ago',  initials: 'SL' },
];

const BAR_HEIGHTS = [40, 65, 50, 80, 55, 90, 75, 95, 70, 85, 60, 100];
const MONTHS      = ['J','F','M','A','M','J','J','A','S','O','N','D'];

const PROJECT_TYPES = ['Software', 'Design', 'Marketing', 'Research', 'Other'];

const AVATAR_BG = ['#F5EDED', '#EDF1F5', '#F5F1ED', '#F0EDF5', '#EDF5F1'];

export function Dashboard() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName,    setProjectName]    = useState('');
  const [projectType,    setProjectType]    = useState('Software');
  const [projectDesc,    setProjectDesc]    = useState('');

  const handleCreate = () => {
    if (!projectName.trim()) return;
    setShowNewProject(false);
    setProjectName(''); setProjectType('Software'); setProjectDesc('');
  };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 960 }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 36, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 5px' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Overview of your workspace</p>
        </div>
        <button
          data-testid="new-project-btn"
          className="btn-primary"
          onClick={() => setShowNewProject(true)}
          style={{ marginTop: 4 }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New project
        </button>
      </header>

      {/* ── New project form ── */}
      {showNewProject && (
        <div className="card" style={{ padding: 24, marginBottom: 20, borderColor: 'rgba(156,89,89,0.35)', boxShadow: '0 0 32px rgba(156,89,89,0.06)' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 18px' }}>
            Create new project
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">Project name</label>
              <input
                type="text"
                placeholder="e.g. Website Redesign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                data-testid="new-project-name-input"
                className="field-input"
                autoFocus
              />
            </div>
            <div>
              <label className="field-label">Project type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                data-testid="new-project-type-select"
                className="field-input"
              >
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">
                Description{' '}
                <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: 10, color: 'var(--text-3)', fontFamily: 'inherit' }}>(optional)</span>
              </label>
              <textarea
                placeholder="What is this project about?"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                data-testid="new-project-desc-input"
                rows={2}
                className="field-input"
                style={{ resize: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button data-testid="create-project-btn"     className="btn-primary" onClick={handleCreate}>Create project</button>
              <button data-testid="cancel-new-project-btn" className="btn-ghost"   onClick={() => setShowNewProject(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {STATS.map((s) => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 8 }}>
              {s.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.up ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart + Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>

        {/* Chart */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
              Project Velocity
            </h2>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              2025
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            {[25, 50, 75].map((pct) => (
              <div key={pct} style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `calc(${pct}% * 140px / 100px)`,
                borderTop: '1px solid var(--border-subtle)',
                pointerEvents: 'none',
              }} />
            ))}
            <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {BAR_HEIGHTS.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, var(--accent) 0%, rgba(156,89,89,0.18) 100%)',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {MONTHS.map((m) => (
              <span key={m} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="card" style={{ padding: '22px 20px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 14px' }}>
            Recent Activity
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {ACTIVITY.map((a, i) => (
              <li key={i} style={{
                display: 'flex',
                gap: 10,
                padding: '9px 0',
                borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: AVATAR_BG[i % AVATAR_BG.length],
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.02em',
                }}>
                  {a.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 500 }}>{a.user}</span>
                    {' '}
                    <span style={{ color: 'var(--text-2)' }}>{a.action}</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {a.time}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
