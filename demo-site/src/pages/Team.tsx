import { useState } from 'react';

const MEMBERS = [
  { name: 'Jonah Davidson', email: 'jonah@acme.com', role: 'Owner', initials: 'JD' },
  { name: 'Sarah Lee', email: 'sarah@acme.com', role: 'Admin', initials: 'SL' },
  { name: 'Marcus Chen', email: 'marcus@acme.com', role: 'Member', initials: 'MC' },
  { name: 'Priya Patel', email: 'priya@acme.com', role: 'Member', initials: 'PP' },
  { name: 'Tom Becker', email: 'tom@acme.com', role: 'Viewer', initials: 'TB' },
];

export function Team() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        <p className="text-slate-500 mt-1">Manage members and their access</p>
      </header>

      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Invite new member</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            data-testid="invite-email-input"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            data-testid="invite-role-select"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option>Admin</option>
            <option>Member</option>
            <option>Viewer</option>
          </select>
          <button
            data-testid="invite-send-btn"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 whitespace-nowrap"
          >
            Send invite
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Members ({MEMBERS.length})</h2>
        </div>
        <ul className="divide-y divide-slate-200">
          {MEMBERS.map((m) => (
            <li key={m.email} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium">
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">{m.name}</div>
                <div className="text-sm text-slate-500">{m.email}</div>
              </div>
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">{m.role}</span>
              <button className="text-slate-400 hover:text-slate-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
