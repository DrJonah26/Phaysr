import { useState } from 'react';

const STATS = [
  { label: 'Tasks Completed', value: '247', change: '+18 today',     up: true },
  { label: 'Open Issues',     value: '5',   change: '−3 this week',  up: true },
  { label: 'Active Projects', value: '12',  change: '+2 this week',  up: true },
  { label: 'Team Members',    value: '8',   change: '+1 this month', up: true },
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

interface Task { id: number; text: string; done: boolean; }
interface Project { id: string; name: string; type: string; tasksTotal: number; tasksDone: number; tasks: Task[]; }

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    type: 'Design',
    tasksTotal: 7,
    tasksDone: 4,
    tasks: [
      { id: 1, text: 'Create wireframes for landing page', done: true },
      { id: 2, text: 'Design color system & typography', done: true },
      { id: 3, text: 'Prototype navigation flow', done: true },
      { id: 4, text: 'Review with stakeholders', done: true },
      { id: 5, text: 'Implement responsive layouts', done: false },
      { id: 6, text: 'Accessibility audit', done: false },
      { id: 7, text: 'Final QA and handoff', done: false },
    ],
  },
  {
    id: 'p2',
    name: 'API v2 Migration',
    type: 'Software',
    tasksTotal: 12,
    tasksDone: 9,
    tasks: [
      { id: 1, text: 'Audit existing endpoints',          done: true },
      { id: 2, text: 'Define new schema contracts',       done: true },
      { id: 3, text: 'Set up staging environment',        done: true },
      { id: 4, text: 'Migrate authentication endpoints',  done: true },
      { id: 5, text: 'Migrate user data endpoints',       done: true },
      { id: 6, text: 'Migrate billing endpoints',         done: true },
      { id: 7, text: 'Update SDK documentation',          done: true },
      { id: 8, text: 'Internal load testing',             done: true },
      { id: 9, text: 'Beta rollout to 5% of users',       done: true },
      { id: 10, text: 'Fix reported regression bugs',     done: false },
      { id: 11, text: 'Full production cutover',          done: false },
      { id: 12, text: 'Deprecate v1 endpoints',           done: false },
    ],
  },
  {
    id: 'p3',
    name: 'Q2 Marketing Push',
    type: 'Marketing',
    tasksTotal: 5,
    tasksDone: 2,
    tasks: [
      { id: 1, text: 'Define target segments',            done: true },
      { id: 2, text: 'Write email campaign copy',         done: true },
      { id: 3, text: 'Design ad creatives',               done: false },
      { id: 4, text: 'Schedule social media posts',       done: false },
      { id: 5, text: 'Set up conversion tracking',        done: false },
    ],
  },
];

const TYPE_COLOR: Record<string, string> = {
  Software:  'var(--accent)',
  Design:    'var(--orange)',
  Marketing: 'var(--green)',
  Research:  '#7C6FAF',
  Other:     'var(--text-3)',
};

export function Dashboard() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName,    setProjectName]    = useState('');
  const [projectType,    setProjectType]    = useState('Software');
  const [projectDesc,    setProjectDesc]    = useState('');

  const [projects, setProjects]           = useState<Project[]>(INITIAL_PROJECTS);
  const [openProject, setOpenProject]     = useState<string | null>(null);
  const [newTaskText,  setNewTaskText]     = useState('');

  const handleCreate = () => {
    if (!projectName.trim()) return;
    const newProj: Project = {
      id: `p${Date.now()}`,
      name: projectName.trim(),
      type: projectType,
      tasksTotal: 0,
      tasksDone: 0,
      tasks: [],
    };
    setProjects((prev) => [newProj, ...prev]);
    setShowNewProject(false);
    setProjectName(''); setProjectType('Software'); setProjectDesc('');
  };

  const toggleTask = (projectId: string, taskId: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const tasks = p.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t);
        return { ...p, tasks, tasksDone: tasks.filter((t) => t.done).length };
      })
    );
  };

  const addTask = (projectId: string) => {
    if (!newTaskText.trim()) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newTask: Task = { id: Date.now(), text: newTaskText.trim(), done: false };
        const tasks = [...p.tasks, newTask];
        return { ...p, tasks, tasksTotal: tasks.length };
      })
    );
    setNewTaskText('');
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
        <div className="card" style={{ padding: 24, marginBottom: 20, borderColor: 'rgba(31,75,22,0.35)', boxShadow: '0 0 32px rgba(31,75,22,0.06)' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
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

      {/* ── Projects ── */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 10 }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
            Projects
          </h2>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {projects.length} total
          </span>
        </div>

        {/* Project list */}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {projects.map((p, i) => {
            const pct = p.tasksTotal > 0 ? Math.round((p.tasksDone / p.tasksTotal) * 100) : 0;
            const color = TYPE_COLOR[p.type] ?? 'var(--text-3)';
            const isOpen = openProject === p.id;
            return (
              <>
                <li
                  key={p.id}
                  data-testid={`project-row-${p.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 24px',
                    borderBottom: (isOpen || i < projects.length - 1) ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.1s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isOpen ? 'var(--elevated)' : 'transparent')}
                >
                  {/* Type dot */}
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />

                  {/* Name + type */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.type}</div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <div style={{ height: 3, borderRadius: 2, background: 'var(--elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', marginTop: 4, textAlign: 'right' }}>
                      {p.tasksDone}/{p.tasksTotal} tasks
                    </div>
                  </div>

                  {/* Open button */}
                  <button
                    data-testid={`open-project-${p.id}`}
                    className="btn-ghost"
                    style={{ padding: '5px 10px', fontSize: 11, flexShrink: 0 }}
                    onClick={() => setOpenProject(isOpen ? null : p.id)}
                  >
                    {isOpen ? 'Close' : 'Open'}
                  </button>
                </li>

                {/* Inline task panel */}
                {isOpen && (
                  <li
                    key={`${p.id}-tasks`}
                    data-testid={`project-tasks-${p.id}`}
                    style={{
                      background: 'var(--elevated)',
                      borderBottom: i < projects.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      padding: '16px 24px 20px 56px',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                      Tasks
                    </div>

                    <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {p.tasks.map((t) => (
                        <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <button
                            data-testid={`task-toggle-${p.id}-${t.id}`}
                            onClick={() => toggleTask(p.id, t.id)}
                            style={{
                              width: 16, height: 16,
                              borderRadius: 4,
                              border: `1.5px solid ${t.done ? color : 'var(--border)'}`,
                              background: t.done ? color : 'transparent',
                              cursor: 'pointer',
                              padding: 0,
                              flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'background 0.1s, border-color 0.1s',
                            }}
                          >
                            {t.done && (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 13l4 4L19 7"/>
                              </svg>
                            )}
                          </button>
                          <span style={{
                            fontSize: 12, color: t.done ? 'var(--text-3)' : 'var(--text-1)',
                            textDecoration: t.done ? 'line-through' : 'none',
                            transition: 'color 0.1s',
                          }}>
                            {t.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Add task */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        placeholder="Add a task..."
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTask(p.id)}
                        data-testid={`add-task-input-${p.id}`}
                        className="field-input"
                        style={{ flex: 1, fontSize: 12 }}
                      />
                      <button
                        data-testid={`add-task-btn-${p.id}`}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => addTask(p.id)}
                      >
                        Add
                      </button>
                    </div>
                  </li>
                )}
              </>
            );
          })}
        </ul>
      </div>

      {/* ── Chart + Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginTop: 10 }}>

        {/* Chart */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
              Project Velocity
            </h2>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              2026
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
                    background: 'linear-gradient(to top, var(--accent) 0%, rgba(31,75,22,0.18) 100%)',
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