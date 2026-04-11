import { useState } from 'react';

export function Settings() {
  const [name, setName] = useState('Jonah Davidson');
  const [email, setEmail] = useState('jonah@acme.com');
  const [notifications, setNotifications] = useState(true);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const handlePasswordSave = () => {
    if (!currentPw || !newPw || newPw !== confirmPw) return;
    setShowPasswordForm(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences</p>
      </header>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="profile-name-input"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="profile-email-input"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <button
            data-testid="save-profile-btn"
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
          >
            Save changes
          </button>
        </div>
      </section>

      {/* Security */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Security</h2>
          {!showPasswordForm && (
            <button
              data-testid="change-password-btn"
              onClick={() => setShowPasswordForm(true)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Change password
            </button>
          )}
        </div>

        {!showPasswordForm ? (
          <div className="text-sm text-slate-500">
            Password last changed 3 months ago.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                data-testid="current-password-input"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                data-testid="new-password-input"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                data-testid="confirm-password-input"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                data-testid="save-password-btn"
                onClick={handlePasswordSave}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
              >
                Update password
              </button>
              <button
                data-testid="cancel-password-btn"
                onClick={() => { setShowPasswordForm(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Notifications</h2>
        <label className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-900">Email notifications</div>
            <div className="text-xs text-slate-500">Get updates about your projects</div>
          </div>
          <button
            onClick={() => setNotifications((n) => !n)}
            data-testid="notifications-toggle"
            className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </label>
      </section>

      {/* Plan */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-slate-900">Current plan: Free</h2>
              <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded">Free</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Upgrade to Pro for unlimited projects, advanced analytics, and priority support.
            </p>
          </div>
          <button
            data-testid="upgrade-plan-btn"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 whitespace-nowrap shadow-sm"
          >
            Upgrade to Pro
          </button>
        </div>
      </section>
    </div>
  );
}
