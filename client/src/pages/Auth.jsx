import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const [error, setError] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const e = p.get('error');
    if (!e) return '';
    if (e === 'google_not_configured' || e === 'github_not_configured')
      return 'OAuth provider is not configured yet.';
    return 'OAuth sign-in failed. Please try again.';
  });

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
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
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-paper text-ink relative">

      {/* ── Left — Editorial hero ── */}
      <section className="hidden md:flex flex-col justify-between w-1/2 p-10 lg:p-16 relative overflow-hidden bg-paper-2 border-r border-rule">

        {/* Concentric rings, like the portfolio hero */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-[90vmin] h-[90vmin] rounded-full border border-rule" />
          <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-[110vmin] h-[110vmin] rounded-full border border-rule-soft" />
          <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-[130vmin] h-[130vmin] rounded-full border border-rule-soft/60" />
          <div
            className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-[55vmin] h-[55vmin] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(138,111,61,0.35) 0%, rgba(30,58,95,0.25) 55%, rgba(30,58,95,0) 70%)',
              filter: 'blur(2px)',
            }}
          />
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-baseline gap-0.5">
            <span className="font-serif text-2xl leading-none tracking-tight">Momentum</span>
            <span className="font-serif italic text-2xl text-brass leading-none">.</span>
          </div>
          <span className="eyebrow">Est. 2026 — Studio Build</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow mb-6">/ 00 A daily practice</p>
          <h1 className="display text-[68px] lg:text-[100px] leading-[0.95]">
            Small<br />
            habits,<br />
            <span className="italic text-brass">compounding</span><br />
            results.
          </h1>
          <p className="text-slate mt-8 text-base leading-relaxed max-w-sm">
            A quiet, editorial dashboard for the things you want to do daily —
            the reading, the walks, the small acts that, stacked together, become
            a life.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex justify-between items-end">
          <div className="grid grid-cols-2 gap-10 max-w-sm">
            <div>
              <p className="eyebrow mb-1">/ A Longest streak</p>
              <p className="font-serif text-4xl tabular-nums leading-none">412</p>
            </div>
            <div>
              <p className="eyebrow mb-1">/ B Check-ins</p>
              <p className="font-serif text-4xl tabular-nums leading-none">1.2M</p>
            </div>
          </div>
          <span className="font-mono text-[11px] tracking-tracked text-slate tabular-nums">
            {clock}
          </span>
        </div>
      </section>

      {/* ── Right — Form ── */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-sm">

          {/* Mobile mark */}
          <div className="md:hidden flex items-center justify-between mb-10">
            <div className="inline-flex items-baseline gap-0.5">
              <span className="font-serif text-2xl leading-none tracking-tight">Momentum</span>
              <span className="font-serif italic text-2xl text-brass leading-none">.</span>
            </div>
            <span className="eyebrow">{clock}</span>
          </div>

          {/* Header */}
          <div className="mb-7">
            <p className="eyebrow mb-3">
              / {tab === 'login' ? '01 Sign in' : '01 Sign up'}
            </p>
            <h2 className="font-serif text-[44px] leading-none tracking-tight">
              {tab === 'login'
                ? <>Welcome <em className="italic text-brass">back.</em></>
                : <>Let's <em className="italic text-brass">begin.</em></>}
            </h2>
            <p className="text-sm text-slate mt-4 leading-relaxed">
              {tab === 'login'
                ? 'Sign in to continue tending to your daily practice.'
                : 'Create an account and start tracking habits — it takes a minute.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div role="tablist" aria-label="Authentication mode" className="flex border-b border-rule mb-6">
            {[
              { id: 'login', label: 'Sign in' },
              { id: 'signup', label: 'Sign up' },
            ].map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => { setTab(id); setError(''); }}
                className={`relative flex-1 h-10 font-mono text-[11px] uppercase tracking-tracked transition-colors ${
                  tab === id ? 'text-ink' : 'text-slate hover:text-ink'
                }`}
              >
                {label}
                {tab === id && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] bg-accent" />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label htmlFor="username" className="label">/ A Username</label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="your_name"
                  required
                  className="input"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                / {tab === 'signup' ? 'B' : 'A'} Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                / {tab === 'signup' ? 'C' : 'B'} Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate hover:text-ink rounded-sm hover:bg-paper-3 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="font-mono text-[11px] uppercase tracking-tracked-tight text-danger bg-danger-soft border border-danger/30 px-3 py-2 rounded-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11"
            >
              {loading
                ? (tab === 'login' ? 'Signing in…' : 'Creating account…')
                : (tab === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7 flex items-center">
            <div className="flex-grow border-t border-rule-soft" />
            <span className="flex-shrink mx-3 font-mono text-[10px] uppercase tracking-tracked text-slate-soft">
              Or continue with
            </span>
            <div className="flex-grow border-t border-rule-soft" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-label="Continue with Google"
              className="btn-secondary h-11"
              onClick={() => { window.location.href = '/api/auth/google'; }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-sans text-sm">Google</span>
            </button>
            <button
              type="button"
              aria-label="Continue with GitHub"
              className="btn-secondary h-11"
              onClick={() => { window.location.href = '/api/auth/github'; }}
            >
              <svg className="w-4 h-4 text-ink shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span className="font-sans text-sm">GitHub</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-rule-soft flex flex-wrap justify-between gap-4">
            <div className="flex gap-5">
              {['Privacy', 'Terms', 'Status'].map(link => (
                <a
                  key={link}
                  href="#"
                  className="font-mono text-[10px] uppercase tracking-tracked text-slate-soft hover:text-ink transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-tracked text-slate-soft">
              © 2026
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
