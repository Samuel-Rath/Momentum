import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res =
        tab === 'login'
          ? await authApi.login({ email: form.email, password: form.password })
          : await authApi.signup(form);
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-surface border-r border-border p-12">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <span className="text-2xl font-bold tracking-tight text-white">Momentum</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold leading-tight text-white">
            Build habits.<br />
            <span className="text-accent">Break limits.</span>
          </h1>
          <p className="text-muted text-lg max-w-md">
            Track your daily discipline, visualize your streaks, and let data-driven insights push you further than motivation alone.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { icon: '🔥', label: 'Streak Tracking', desc: 'Never break the chain' },
              { icon: '📊', label: 'Analytics', desc: 'See your patterns clearly' },
              { icon: '🤖', label: 'AI Insights', desc: 'Know your weaknesses' },
              { icon: '⚡', label: 'Daily Check-in', desc: 'One tap per habit' },
            ].map((f) => (
              <div key={f.label} className="bg-elevated border border-border rounded-xl p-4">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="font-semibold text-white text-sm">{f.label}</div>
                <div className="text-muted text-xs mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted text-sm">Discipline is the bridge between goals and accomplishment.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold text-white">Momentum</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white">
              {tab === 'login' ? 'Welcome back' : 'Start your journey'}
            </h2>
            <p className="text-muted mt-2">
              {tab === 'login'
                ? 'Log in to see your progress'
                : 'Create your account — it takes 30 seconds'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-elevated rounded-lg p-1">
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-accent text-white shadow'
                    : 'text-muted hover:text-white'
                }`}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="yourusername"
                  required
                  className="input"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="input"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading
                ? 'Loading...'
                : tab === 'login'
                ? 'Log In'
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-muted text-sm">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-accent hover:underline font-medium"
            >
              {tab === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
