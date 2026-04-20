import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu, X, LayoutDashboard, ListChecks, BarChart3,
  Settings, HelpCircle, LogOut, Plus, User, Trash2, Pencil,
} from 'lucide-react';
import { authApi } from '../../lib/api';

const NEW_HABIT_LINK = '/habits?new=1';

const NAV_ITEMS = [
  { to: '/', num: '01', Icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/habits', num: '02', Icon: ListChecks, label: 'Tasks' },
  { to: '/analytics', num: '03', Icon: BarChart3, label: 'Analytics' },
];

const PAGE_META = {
  '/': {
    eyebrow: '/ 01 Overview',
    title: 'Today',
    italic: 'in brief.',
    subtitle: 'Here is how the day is shaping up.',
  },
  '/habits': {
    eyebrow: '/ 02 Tasks',
    title: 'The',
    italic: 'practices',
    trailing: 'you track.',
    subtitle: 'Manage the habits that make up your daily routine.',
  },
  '/analytics': {
    eyebrow: '/ 03 Analytics',
    title: 'Patterns &',
    italic: 'progress.',
    subtitle: 'Your consistency, across weeks and months.',
  },
};

export default function AppShell() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
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

  const page = PAGE_META[location.pathname] || {
    eyebrow: '/ Momentum',
    title: 'Momentum',
  };

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

  function openProfileEdit() {
    setUsernameDraft(user?.username || '');
    setProfileError('');
    setEditingName(true);
  }

  async function saveProfile() {
    setProfileSaving(true);
    setProfileError('');
    try {
      const res = await authApi.updateProfile({ username: usernameDraft });
      setUser(res.data);
      setEditingName(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update');
    } finally {
      setProfileSaving(false);
    }
  }

  function closeSettings() {
    setSettingsOpen(false);
    setDeleteConfirm(false);
    setLogoutConfirm(false);
    setEditingName(false);
    setProfileError('');
  }

  return (
    <div className="h-screen overflow-hidden bg-paper flex text-ink">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[264px] bg-paper-2 border-r border-rule flex flex-col transition-transform duration-300 ease-out-expo lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:flex`}
      >
        {/* Mark */}
        <div className="px-6 pt-7 pb-6">
          <Link to="/" onClick={() => setMobileOpen(false)} className="inline-flex items-baseline gap-0.5 group">
            <span className="font-serif text-[28px] leading-none tracking-tight">Momentum</span>
            <span className="font-serif italic text-[28px] leading-none text-brass">.</span>
          </Link>
          <p className="eyebrow mt-2">A daily practice</p>
        </div>

        <div className="hairline mx-6" />

        {/* Nav */}
        <nav className="flex-1 px-4 py-5">
          <p className="eyebrow px-3 mb-3">/ Workspace</p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ to, num, Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  isActive ? 'nav-item-active group' : 'nav-item group'
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`font-mono text-[10px] w-5 shrink-0 ${isActive ? 'text-brass' : 'text-slate-soft'}`}>
                      {num}
                    </span>
                    <Icon size={14} className={isActive ? 'text-accent' : ''} />
                    <span className="flex-1">{label}</span>
                    {isActive && <span className="w-1 h-1 rounded-full bg-brass" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-rule-soft p-4">
          <div className="space-y-0.5 mb-3">
            <button
              onClick={() => { setSettingsOpen(true); setMobileOpen(false); }}
              className="nav-item w-full"
            >
              <span className="font-mono text-[10px] w-5 shrink-0 text-slate-soft">—</span>
              <Settings size={14} />
              <span>Settings</span>
            </button>
            <button
              onClick={() => { setSupportOpen(true); setMobileOpen(false); }}
              className="nav-item w-full"
            >
              <span className="font-mono text-[10px] w-5 shrink-0 text-slate-soft">—</span>
              <HelpCircle size={14} />
              <span>Help</span>
            </button>
          </div>

          <div className="hairline mb-3" />

          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-paper font-serif italic text-sm shrink-0">
              {user?.username?.[0]?.toLowerCase() || 'u'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-serif text-[15px] leading-tight truncate">
                {user?.username || 'User'}
              </span>
              <span className="eyebrow truncate text-[10px]">
                {user?.email || ''}
              </span>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="p-1.5 rounded-sm text-slate-soft hover:text-ink hover:bg-paper-3 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="shrink-0 bg-paper/90 backdrop-blur-md border-b border-rule">
          <div className="flex items-center justify-between px-5 sm:px-8 py-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                className="lg:hidden -ml-1 p-2 rounded-sm text-slate hover:text-ink hover:bg-paper-2"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="eyebrow">{page.eyebrow}</p>
                <h1 className="font-serif text-xl sm:text-2xl leading-tight tracking-tight mt-0.5 truncate">
                  {page.title}
                  {page.italic && <> <em className="italic text-brass not-italic-sm">{page.italic}</em></>}
                  {page.trailing && <> <span>{page.trailing}</span></>}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 pl-4">
              <span className="hidden md:inline font-mono text-[11px] tracking-tracked-tight text-slate tabular-nums">
                {clock}
              </span>
              <div className="hidden md:block w-px h-4 bg-rule" />
              <Link to={NEW_HABIT_LINK} className="btn-primary h-9 px-4 text-[13px]">
                <Plus size={14} />
                <span className="hidden sm:inline">New task</span>
              </Link>
              <button
                aria-label="Account"
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-sm text-slate hover:text-ink hover:bg-paper-2"
              >
                <User size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* ── Settings Modal ── */}
      {settingsOpen && (
        <Modal
          onClose={closeSettings}
          eyebrow="/ 08 Preferences"
          title="Your"
          italic="settings."
        >
          <div className="space-y-5">
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-paper font-serif italic text-lg shrink-0">
                  {user?.username?.[0]?.toLowerCase() || 'u'}
                </div>
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <>
                      <label htmlFor="profile-username" className="label">Username</label>
                      <input
                        id="profile-username"
                        autoFocus
                        value={usernameDraft}
                        onChange={e => { setUsernameDraft(e.target.value); setProfileError(''); }}
                        minLength={2}
                        maxLength={32}
                        className="input input-sm"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-lg leading-tight truncate">{user?.username || 'User'}</p>
                        {profileSaved && <span className="badge-success">Saved</span>}
                      </div>
                      <p className="eyebrow truncate mt-1">{user?.email || ''}</p>
                    </>
                  )}
                </div>
                {!editingName && (
                  <button
                    onClick={openProfileEdit}
                    aria-label="Edit username"
                    className="btn-ghost h-8 w-8 px-0"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              {editingName && (
                <>
                  {profileError && (
                    <p className="mt-2 text-xs text-danger" role="alert">{profileError}</p>
                  )}
                  <div className="mt-3 flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditingName(false); setProfileError(''); }}
                      disabled={profileSaving}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={profileSaving || !usernameDraft.trim() || usernameDraft.trim() === user?.username}
                      className="btn-primary h-9"
                    >
                      {profileSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              {!logoutConfirm ? (
                <button
                  onClick={() => setLogoutConfirm(true)}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-sm bg-paper-2 hover:bg-paper-3 border border-rule-soft font-sans text-sm text-ink transition-colors"
                >
                  <LogOut size={15} className="text-slate" />
                  Sign out
                </button>
              ) : (
                <div className="card p-4 space-y-3">
                  <p className="font-serif text-lg leading-tight">
                    Sign out of <em className="italic text-brass">Momentum?</em>
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setLogoutConfirm(false)} className="btn-ghost">Cancel</button>
                    <button onClick={handleLogout} className="btn-primary h-9">Sign out</button>
                  </div>
                </div>
              )}

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-sm bg-danger-soft hover:bg-danger/15 border border-danger/30 font-sans text-sm text-danger transition-colors"
                >
                  <Trash2 size={15} />
                  Delete account
                </button>
              ) : (
                <div className="card border-danger/30 bg-danger-soft p-4 space-y-3">
                  <p className="text-sm text-danger leading-relaxed">
                    Permanently delete your account and all data? This cannot be undone.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setDeleteConfirm(false)} className="btn-ghost">Cancel</button>
                    <button onClick={handleDeleteAccount} disabled={deleting} className="btn-danger h-9">
                      {deleting ? 'Deleting…' : 'Confirm delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Support Modal ── */}
      {supportOpen && (
        <Modal
          onClose={() => setSupportOpen(false)}
          eyebrow="/ 09 Help"
          title="A brief"
          italic="guide."
          wide
        >
          <div className="space-y-4">
            {[
              { num: 'A', title: 'Creating tasks', body: 'Go to Tasks and select "New task" to add a habit. Choose a category and frequency.' },
              { num: 'B', title: 'Logging each day', body: 'Open Overview and tick the box next to each task. Toggle the chevron to add notes.' },
              { num: 'C', title: 'Streaks', body: 'A streak tracks consecutive days completed. Current and longest streaks live on Analytics.' },
              { num: 'D', title: 'Daily reset', body: 'The day resets at midnight in your local timezone. A countdown sits in the top bar.' },
              { num: 'E', title: 'Analytics', body: 'A 90-day heatmap, weekly completion chart, and top streaks summarise your consistency.' },
              { num: 'F', title: 'Removing tasks', body: 'Open Tasks, hover a card, and select delete. Confirm to remove the task permanently.' },
            ].map(item => (
              <div key={item.title} className="grid grid-cols-[32px_1fr] gap-4 py-3 border-t border-rule-soft first:border-t-0">
                <span className="font-mono text-[11px] uppercase tracking-tracked-tight text-brass pt-1">{item.num}.</span>
                <div>
                  <p className="font-serif text-lg leading-tight mb-1">{item.title}</p>
                  <p className="text-sm text-slate leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ onClose, eyebrow, title, italic, wide, children }) {
  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} bg-paper border border-rule rounded-md shadow-elevated animate-slide-up max-h-[85vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-5 border-b border-rule-soft shrink-0">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 className="font-serif text-2xl leading-tight tracking-tight">
              {title}
              {italic && <> <em className="italic text-brass">{italic}</em></>}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost h-8 w-8 px-0 shrink-0 -mr-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
