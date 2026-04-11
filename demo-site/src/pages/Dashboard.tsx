import { useState } from 'react';

const STATS = [
  { label: 'Active Projects', value: '12', change: '+2 this week' },
  { label: 'Team Members', value: '8', change: '+1 this month' },
  { label: 'Tasks Completed', value: '247', change: '+18 today' },
  { label: 'Open Issues', value: '5', change: '-3 this week' },
];

const ACTIVITY = [
  { user: 'Sarah Lee', action: 'closed issue #142', time: '2m ago' },
  { user: 'Marcus Chen', action: 'pushed to main', time: '12m ago' },
  { user: 'Priya Patel', action: 'commented on PR #88', time: '1h ago' },
  { user: 'Tom Becker', action: 'created Project Atlas', time: '3h ago' },
  { user: 'Sarah Lee', action: 'invited a new member', time: '5h ago' },
];

const PROJECT_TYPES = ['Software', 'Design', 'Marketing', 'Research', 'Other'];

export function Dashboard() {
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Software');
  const [projectDesc, setProjectDesc] = useState('');

  const handleCreate = () => {
    if (!projectName.trim()) return;
    setShowNewProject(false);
    setProjectName('');
    setProjectType('Software');
    setProjectDesc('');
  };

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your workspace</p>
        </div>
        <button
          data-testid="new-project-btn"
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New Project
        </button>
      </header>

      {showNewProject && (
        <div className="bg-white rounded-xl border border-indigo-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Create new project</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project name</label>
              <input
                type="text"
                placeholder="e.g. Website Redesign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                data-testid="new-project-name-input"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                data-testid="new-project-type-select"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                placeholder="What is this project about?"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                data-testid="new-project-desc-input"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                data-testid="create-project-btn"
                onClick={handleCreate}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
              >
                Create project
              </button>
              <button
                data-testid="cancel-new-project-btn"
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-sm font-medium text-slate-500">{s.label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{s.value}</div>
            <div className="mt-1 text-xs text-emerald-600">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Project Velocity</h2>
          <div className="h-48 flex items-end gap-2">
            {[40, 65, 50, 80, 55, 90, 75, 95, 70, 85, 60, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-100 rounded-t hover:bg-indigo-200 transition-colors" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-xs font-medium text-slate-600">
                  {a.user.split(' ').map((p) => p[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900"><span className="font-medium">{a.user}</span> {a.action}</div>
                  <div className="text-xs text-slate-400">{a.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
