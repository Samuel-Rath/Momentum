import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Show error passed back from OAuth failure redirect
  const [error, setError] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const e = p.get('error');
    if (!e) return '';
    if (e === 'google_not_configured' || e === 'github_not_configured') return 'OAuth provider is not configured yet.';
    return 'OAuth sign-in failed. Please try again.';
  });

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
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-background text-on-surface">

      {/* ── Left panel — Marketing ── */}
      <section className="hidden md:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden bg-surface-container-lowest">

        {/* Background grid overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-container-lowest to-surface opacity-90" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,182,144,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,182,144,1) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
          {/* Glow accents */}
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full translate-x-1/2" />
          <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-primary-container/10 blur-[100px] rounded-full -translate-x-1/2" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-primary-container font-black text-2xl tracking-tighter">MOMENTUM</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 mt-auto mb-auto max-w-lg">
          <span className="font-label text-primary uppercase tracking-[0.2em] text-[0.6875rem] font-bold">
            KINETIC PRECISION
          </span>
          <h1 className="text-on-surface font-headline font-extrabold text-[3.5rem] leading-[1.1] tracking-[-0.02em] mt-4">
            DISCIPLINE<br />IS THE<br />ENGINE.
          </h1>
          <p className="text-on-surface-variant mt-8 text-lg font-medium leading-relaxed max-w-md opacity-80">
            The elite operating system for human potential. Quantify your focus, accelerate your habits, and achieve peak performance.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-12">
          <div>
            <span className="font-label text-on-surface-variant uppercase tracking-widest text-[0.6875rem]">
              STREAK REACHED
            </span>
            <div className="text-primary-container font-headline font-black text-4xl">412</div>
          </div>
          <div>
            <span className="font-label text-on-surface-variant uppercase tracking-widest text-[0.6875rem]">
              DATA POINTS
            </span>
            <div className="text-on-surface font-headline font-black text-4xl">1.2M</div>
          </div>
        </div>
      </section>

      {/* ── Right panel — Auth form ── */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-16 relative">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="md:hidden flex justify-center mb-12">
            <span className="text-primary-container font-black text-2xl tracking-tighter">MOMENTUM</span>
          </div>

          {/* Glass card */}
          <div className="obsidian-layer p-1 momentum-glow border border-white/5">

            {/* Tab switcher — flat with border-b indicator */}
            <div className="flex">
              {[
                { id: 'login', label: 'LOGIN' },
                { id: 'signup', label: 'SIGN UP' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setError(''); }}
                  className={`flex-1 py-4 font-label text-[0.75rem] font-bold tracking-widest uppercase transition-all ${
                    tab === id
                      ? 'text-primary border-b-2 border-primary-container bg-surface-container-low'
                      : 'text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-8 pt-10">

              {/* Header */}
              <div className="mb-10">
                <h2 className="text-on-surface font-headline font-bold text-xl uppercase tracking-tighter">
                  {tab === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
                </h2>
                <p className="text-on-surface-variant text-xs mt-1 uppercase tracking-widest font-medium opacity-60">
                  {tab === 'login' ? 'SIGN IN TO YOUR ACCOUNT' : 'START TRACKING YOUR HABITS'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {tab === 'signup' && (
                  <div className="space-y-1">
                    <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 block px-1">
                      USERNAME
                    </label>
                    <div className="relative group">
                      <input
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="your_username"
                        required
                        className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary-container/40 text-on-surface py-4 px-4 placeholder:text-on-surface-variant/20 font-label text-xs tracking-wider transition-all duration-200 outline-none"
                      />
                      <div className="absolute inset-0 border-l-2 border-transparent group-focus-within:border-primary-container pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 block px-1">
                    EMAIL
                  </label>
                  <div className="relative group">
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary-container/40 text-on-surface py-4 px-4 placeholder:text-on-surface-variant/20 font-label text-xs tracking-wider transition-all duration-200 outline-none"
                    />
                    <div className="absolute inset-0 border-l-2 border-transparent group-focus-within:border-primary-container pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 block">
                      PASSWORD
                    </label>
                    <a href="#" className="font-label text-[0.625rem] uppercase tracking-widest text-primary hover:text-primary-container transition-colors">
                      FORGOT PASSWORD
                    </a>
                  </div>
                  <div className="relative group">
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      required
                      minLength={6}
                      className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary-container/40 text-on-surface py-4 px-4 placeholder:text-on-surface-variant/20 font-label text-xs tracking-wider transition-all duration-200 outline-none"
                    />
                    <div className="absolute inset-0 border-l-2 border-transparent group-focus-within:border-primary-container pointer-events-none" />
                  </div>
                </div>

                {error && (
                  <div className="bg-error-container/20 border border-error/20 text-error text-xs px-4 py-3 font-mono uppercase tracking-wider">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-container text-on-primary-container font-headline font-black py-5 tracking-widest uppercase text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 ease-out-expo mt-4 disabled:opacity-50"
                >
                  {loading
                    ? (tab === 'login' ? 'SIGNING IN…' : 'CREATING ACCOUNT…')
                    : (tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT')}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-10 flex items-center">
                <div className="flex-grow border-t border-white/5" />
                <span className="flex-shrink mx-4 font-label text-[0.625rem] text-on-surface-variant/30 uppercase tracking-[0.3em]">
                  OR CONTINUE WITH
                </span>
                <div className="flex-grow border-t border-white/5" />
              </div>

              {/* Social login */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 py-3 bg-surface-container-high hover:bg-surface-container-highest border border-white/5 transition-all duration-200 group"
                  onClick={() => { window.location.href = '/api/auth/google'; }}
                >
                  <svg className="w-4 h-4 text-on-surface-variant group-hover:text-on-surface shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.909 3.292-2.09 4.213-1.217.956-3.053 1.957-5.75 1.957-4.428 0-8.01-3.591-8.01-8.01s3.582-8.01 8.01-8.01c2.39 0 4.14.94 5.43 2.15l2.32-2.32c-1.9-1.83-4.39-2.93-7.75-2.93-6.12 0-11.14 5.02-11.14 11.14s5.02 11.14 11.14 11.14c3.3 0 5.8-1.09 7.71-3.09 1.97-1.97 2.59-4.75 2.59-7.06 0-.46-.04-.92-.12-1.36h-10.27z" />
                  </svg>
                  <span className="font-label text-[0.6875rem] uppercase tracking-widest font-bold">GOOGLE</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-3 py-3 bg-surface-container-high hover:bg-surface-container-highest border border-white/5 transition-all duration-200 group"
                  onClick={() => { window.location.href = '/api/auth/github'; }}
                >
                  <svg className="w-4 h-4 text-on-surface-variant group-hover:text-on-surface shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span className="font-label text-[0.6875rem] uppercase tracking-widest font-bold">GITHUB</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-8 px-4">
            {['Privacy Policy', 'Terms of Service', 'System Status'].map(link => (
              <a
                key={link}
                href="#"
                className="font-label text-[0.625rem] text-on-surface-variant/40 hover:text-on-surface transition-colors uppercase tracking-[0.2em]"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SVG decoration */}
      <div className="absolute bottom-10 right-10 hidden lg:block opacity-20 pointer-events-none">
        <svg width="200" height="200" viewBox="0 0 100 100" className="text-primary-container">
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="2 2" />
          <path d="M50 2 L50 98 M2 50 L98 50" stroke="currentColor" strokeWidth="0.05" />
          <text x="52" y="10" fill="currentColor" className="font-label" style={{ fontSize: '2px' }}>MOMENTUM_OS v.4.0.1</text>
        </svg>
      </div>
    </main>
  );
}
