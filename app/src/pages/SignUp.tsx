import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function SignUp() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      nav('/onboarding');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'error';
      if (msg === 'email_taken') setError('An account with this email already exists.');
      else if (msg === 'invalid_email') setError('Please enter a valid email address.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="auth-card">
        <a href="http://localhost:5173" className="auth-logo">Phays<span>r</span></a>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start for free — no credit card required</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label>Work email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field" style={{ marginBottom: 24 }}>
            <label>Password <span style={{ color: 'var(--ink2)', fontWeight: 400 }}>(min. 8 characters)</span></label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
