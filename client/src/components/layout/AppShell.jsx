import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';
import { authApi } from '../../lib/api';

const NAV_ITEMS = [
  { to: '/', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/habits', icon: 'event_repeat', label: 'Habits' },
  { to: '/analytics', icon: 'insights', label: 'Analytics' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleLogout() {
    logout();
    navigate('/auth');
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      logout();
      navigate('/auth');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  function closeSettings() {
    setSettingsOpen(false);
    setDeleteConfirm(false);
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#131318] border-r border-[#35343a]/15 flex flex-col py-8 transition-transform duration-300 ease-out-expo lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="px-6 mb-12">
          <h1 className="text-xl font-black tracking-tighter text-primary-container">MOMENTUM</h1>
          <p className="font-label uppercase tracking-[0.05em] text-[0.6875rem] font-medium text-on-surface-variant opacity-70">
            KINETIC PRECISION
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-4 py-3 bg-surface-container-low text-primary border-l-2 border-primary-container font-label uppercase tracking-[0.05em] text-[0.6875rem] font-medium transition-all duration-200'
                  : 'flex items-center gap-3 px-4 py-3 text-on-surface-variant opacity-70 hover:bg-[#35343a] hover:opacity-100 font-label uppercase tracking-[0.05em] text-[0.6875rem] font-medium transition-all duration-200 ease-out-expo'
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
                  >
                    {icon}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* NEW HABIT button */}
        <div className="px-4 mb-8">
          <Link
            to="/habits"
            onClick={() => setMobileOpen(false)}
            className="block w-full bg-primary-container text-on-primary-container font-black py-3 text-[0.6875rem] tracking-widest uppercase text-center hover:brightness-110 transition-all active:scale-95"
          >
            NEW HABIT
          </Link>
        </div>

        {/* Footer links */}
        <div className="mt-auto space-y-0.5">
          <button
            onClick={() => { setSettingsOpen(true); setMobileOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant opacity-70 hover:bg-[#35343a] hover:opacity-100 font-label uppercase tracking-[0.05em] text-[0.6875rem] font-medium transition-all duration-200 ease-out-expo"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
          </button>
          <button
            onClick={() => { setSupportOpen(true); setMobileOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant opacity-70 hover:bg-[#35343a] hover:opacity-100 font-label uppercase tracking-[0.05em] text-[0.6875rem] font-medium transition-all duration-200 ease-out-expo"
          >
            <span className="material-symbols-outlined text-lg">help_outline</span>
            Support
          </button>

          {/* User profile */}
          <div className="flex items-center gap-3 px-6 py-4 mt-2 border-t border-[#35343a]/15">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-black text-xs shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[0.75rem] font-bold truncate uppercase tracking-tighter">
                {user?.username || 'OPERATOR'}
              </span>
              <button
                onClick={handleLogout}
                className="text-[0.625rem] opacity-40 uppercase tracking-tighter text-left hover:opacity-80 transition-opacity"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Fixed top app bar — full width on mobile, offset on desktop */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 z-40 bg-[#131318]/60 backdrop-blur-xl flex justify-between items-center px-4 sm:px-8 border-b border-[#35343a]/10">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-on-surface-variant hover:text-on-surface p-1 mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex items-center gap-3 flex-1">
            <span className="material-symbols-outlined text-on-surface-variant text-lg hidden sm:block">search</span>
            <input
              className="bg-transparent border-none text-[0.75rem] font-bold uppercase tracking-widest focus:ring-0 focus:outline-none text-on-surface-variant w-28 sm:w-48 lg:w-64 placeholder:text-[#35343a]"
              placeholder="COMMAND SEARCH..."
              readOnly
            />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-[0.75rem] font-bold uppercase tracking-widest text-primary-container">
                Momentum
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            </div>
            <button className="text-on-surface-variant hover:text-primary transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface" />
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-16 overflow-y-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* FAB */}
      <Link
        to="/habits"
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.06)] z-50 hover:brightness-110 active:scale-95 transition-all duration-200 ease-out-expo group"
      >
        <span
          className="material-symbols-outlined text-2xl sm:text-3xl font-bold group-hover:rotate-90 transition-transform duration-300"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          add
        </span>
      </Link>

      {/* ── Settings Modal ── */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-[#1b1b20] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div>
                <h2 className="font-bold text-lg text-on-surface uppercase tracking-tighter">Settings</h2>
                <p className="text-on-surface-variant text-xs mt-0.5 uppercase tracking-widest opacity-60">Account &amp; Preferences</p>
              </div>
              <button onClick={closeSettings} className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container-highest transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4 p-4 bg-surface-container-low">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-black text-lg shrink-0">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm uppercase tracking-tight truncate">{user?.username || 'OPERATOR'}</p>
                  <p className="text-[0.6875rem] text-on-surface-variant opacity-60 truncate">{user?.email || ''}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all text-[0.6875rem] font-bold uppercase tracking-widest"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Sign Out
                </button>

                <div className="border-t border-white/5 pt-3">
                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-error/5 hover:bg-error/10 text-error transition-all text-[0.6875rem] font-bold uppercase tracking-widest border border-error/20"
                    >
                      <span className="material-symbols-outlined text-lg">delete_forever</span>
                      Delete Account
                    </button>
                  ) : (
                    <div className="bg-error/10 border border-error/20 p-4 space-y-3">
                      <p className="text-error text-xs font-bold uppercase tracking-wide leading-relaxed">
                        Permanently delete your account and all data? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="flex-1 py-2.5 bg-surface-container-highest text-on-surface-variant text-[0.6875rem] font-bold uppercase tracking-widest hover:bg-surface-container-low transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                          className="flex-1 py-2.5 bg-error text-on-error text-[0.6875rem] font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                        >
                          {deleting ? 'Deleting…' : 'Confirm Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Support Modal ── */}
      {supportOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#1b1b20] border border-white/5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
              <div>
                <h2 className="font-bold text-lg text-on-surface uppercase tracking-tighter">Support</h2>
                <p className="text-on-surface-variant text-xs mt-0.5 uppercase tracking-widest opacity-60">Help &amp; Documentation</p>
              </div>
              <button onClick={() => setSupportOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container-highest transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto space-y-6">
              {[
                { icon: 'add_task', title: 'Creating Habits', body: 'Navigate to Habits and click "New Protocol" or the + button. Give your habit a name, choose a category, and set the frequency.' },
                { icon: 'check_circle', title: 'Logging Daily', body: 'Visit the Dashboard each day. Tick the checkbox next to each habit to mark it complete. Use the chevron to add execution notes.' },
                { icon: 'local_fire_department', title: 'Streaks & Multiplier', body: 'Your streak increases each consecutive day you complete a habit. The Streak Multiplier (1 + streak × 0.08) compounds your performance score.' },
                { icon: 'schedule', title: 'Daily Reset', body: 'The day resets at midnight AEST (Australian Eastern Standard Time). A countdown timer is shown on the Dashboard.' },
                { icon: 'insights', title: 'Analytics', body: 'Track your consistency heatmap, completion rates, and precision insights on the Analytics page. Use the Guide section for further detail.' },
                { icon: 'delete_forever', title: 'Removing Habits', body: 'Open the Habits page, hover over a card, and click the delete icon. Confirm the prompt to permanently remove the protocol.' },
              ].map(item => (
                <div key={item.title} className="flex gap-4">
                  <span className="material-symbols-outlined text-primary shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>{item.icon}</span>
                  <div>
                    <p className="text-[0.6875rem] font-black uppercase tracking-widest mb-1">{item.title}</p>
                    <p className="text-[0.6875rem] text-on-surface-variant opacity-70 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}

              <div className="bg-surface-container-low p-4 border-l-2 border-secondary/30">
                <p className="text-[0.625rem] font-black text-secondary uppercase tracking-widest mb-1">Need More Help</p>
                <p className="text-[0.6875rem] text-on-surface-variant opacity-70 leading-relaxed">
                  Report issues or request features on GitHub. Reach out via your account's registered email address for account-related queries.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
