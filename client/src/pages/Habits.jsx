import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { habitsApi } from '../lib/api';
import { CATEGORIES, HABIT_COLORS, FREQUENCIES, cn } from '../lib/utils';
import { Pencil, Trash2, X } from 'lucide-react';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingInFlight, setDeletingInFlight] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultForm = { name: '', category: 'health', frequency: 'daily', color: HABIT_COLORS[0], icon: '⚡' };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    habitsApi.getAll()
      .then(r => setHabits(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-open create modal when navigated with ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function openCreate() { setEditing(null); setForm(defaultForm); setError(''); setModalOpen(true); }

  function openEdit(habit) {
    setEditing(habit);
    setForm({ name: habit.name, category: habit.category, frequency: habit.frequency, color: habit.color || HABIT_COLORS[0], icon: habit.icon || '⚡' });
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) {
        const res = await habitsApi.update(editing.id, form);
        setHabits(p => p.map(h => h.id === editing.id ? res.data : h));
      } else {
        const res = await habitsApi.create(form);
        setHabits(p => [...p, res.data]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingInFlight(true);
    try {
      await habitsApi.remove(deleting.id);
      setHabits(p => p.filter(h => h.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingInFlight(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>event_repeat</span>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest">Loading protocols…</p>
      </div>
    );
  }

  const categoryCount = new Set(habits.map(h => h.category)).size;

  return (
    <div className="pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-28 sm:pb-32">

      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-12 gap-6">
        <div className="flex-1">
          <h1 className="text-[2.5rem] sm:text-[3.5rem] font-black tracking-[-0.02em] leading-none mb-2 text-on-surface uppercase">
            Discipline <span className="text-primary">Protocols</span>
          </h1>
          <p className="text-on-surface-variant tracking-widest text-[0.75rem] uppercase font-medium max-w-lg opacity-60">
            Surgical execution of daily objectives. System state: High-Performance Velocity.
          </p>
        </div>
        <div className="flex gap-3 sm:gap-4 w-full md:w-auto">
          <div className="bg-surface-container-low p-4 sm:p-6 flex-1 md:min-w-[160px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-container" />
            <div className="text-[0.625rem] font-bold uppercase tracking-[0.1em] opacity-40 mb-1">Active Protocols</div>
            <div className="text-3xl sm:text-4xl font-black text-on-surface mb-1 tracking-tighter">
              {habits.length}<span className="text-xl opacity-40"> total</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 mt-2">
              <div className="bg-primary h-full transition-all duration-700" style={{ width: `${Math.min(habits.length * 10, 100)}%` }} />
            </div>
          </div>
          <div className="bg-surface-container-low p-4 sm:p-6 flex-1 md:min-w-[160px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-tertiary" />
            <div className="text-[0.625rem] font-bold uppercase tracking-[0.1em] opacity-40 mb-1">Categories</div>
            <div className="text-3xl sm:text-4xl font-black text-on-surface mb-1 tracking-tighter">
              {categoryCount}<span className="text-xl opacity-40">/{CATEGORIES.length}</span>
            </div>
            <div className="flex gap-1 mt-3">
              {Array.from({ length: CATEGORIES.length }).map((_, i) => (
                <div key={i} className={`h-1 w-3 ${i < categoryCount ? 'bg-tertiary' : 'bg-surface-container-highest'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bento grid */}
      {habits.length === 0 ? (
        <div className="bg-surface-container-low p-10 sm:p-16 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/30 block mb-4" style={{ fontSize: '56px' }}>add_task</span>
          <p className="font-black text-xl text-on-surface uppercase tracking-tighter">No protocols initialised</p>
          <p className="text-on-surface-variant text-sm mt-2 mb-6 uppercase tracking-widest opacity-60">
            Begin with a single, high-leverage habit and build momentum.
          </p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            Initialise Protocol
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-12 gap-4 sm:gap-6 mb-12 sm:mb-16">

          {/* Featured large card — col 8 */}
          {habits[0] && (
            <div className="col-span-12 lg:col-span-8 bg-surface-container-low p-6 sm:p-8 relative overflow-hidden group hover:bg-[#1b1b20] transition-all duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[0.625rem] font-bold uppercase tracking-widest border border-primary/20">
                      {habits[0].category?.toUpperCase()}
                    </span>
                    <span className="text-[0.625rem] font-bold text-on-surface-variant tracking-widest opacity-40 uppercase">
                      {habits[0].frequency?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-on-surface uppercase tracking-tight">{habits[0].name}</h3>
                </div>
                <div className="text-4xl sm:text-5xl shrink-0 ml-4">{habits[0].icon || '⚡'}</div>
              </div>
              {/* Decorative bar chart */}
              <div className="flex gap-2 items-end h-12 sm:h-16 mb-6 sm:mb-8">
                <div className="flex-1 bg-surface-container-highest" style={{ height: '30%' }} />
                <div className="flex-1 bg-surface-container-highest" style={{ height: '50%' }} />
                <div className="flex-1 bg-primary/40" style={{ height: '70%' }} />
                <div className="flex-1 bg-primary/60" style={{ height: '55%' }} />
                <div className="flex-1 bg-primary" style={{ height: '100%' }} />
                <div className="flex-1 self-stretch bg-primary/10 border border-dashed border-primary/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">add</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 sm:pt-6 border-t border-[#35343a]/15">
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(habits[0])} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleting(habits[0])} aria-label="Delete habit" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <Link
                  to="/"
                  className="bg-surface-container-highest text-on-surface px-4 sm:px-6 py-2 text-[0.6875rem] font-bold uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-container transition-all duration-200"
                >
                  MARK COMPLETE
                </Link>
              </div>
            </div>
          )}

          {/* Secondary card — col 4 */}
          {habits[1] && (
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-surface-container-low p-6 sm:p-8 flex flex-col justify-between group hover:bg-[#1b1b20] transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="material-symbols-outlined text-secondary text-3xl">{getMaterialIcon(habits[1].category)}</span>
                  <div className="px-2 py-1 bg-surface-container-highest text-secondary text-[0.625rem] font-bold uppercase tracking-widest">
                    {habits[1].frequency?.toUpperCase()}
                  </div>
                </div>
                <h3 className="text-xl font-black text-on-surface uppercase tracking-tight mb-2">{habits[1].name}</h3>
                <p className="text-on-surface-variant text-[0.6875rem] leading-relaxed opacity-60">
                  {habits[1].category} · {habits[1].frequency}
                </p>
              </div>
              <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[0.625rem] font-bold uppercase tracking-widest opacity-40">Category</span>
                  <span className="text-sm font-bold text-secondary">{habits[1].icon || '⚡'} {habits[1].category}</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest">
                  <div className="h-full bg-secondary" style={{ width: '65%' }} />
                </div>
                <div className="flex items-center gap-1 mt-4 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(habits[1])} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleting(habits[1])} aria-label="Delete habit" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-error transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Small cards for remaining habits */}
          {habits.slice(2).map(habit => (
            <div
              key={habit.id}
              className="col-span-12 sm:col-span-6 lg:col-span-4 bg-surface-container-low p-6 sm:p-8 group hover:bg-[#1b1b20] transition-all duration-300 border-l-2 border-transparent hover:border-primary-container/40"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">{getMaterialIcon(habit.category)}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[0.75rem] font-bold text-on-surface uppercase tracking-widest truncate">{habit.name}</h3>
                  <div className="text-[0.625rem] text-primary font-bold uppercase">{habit.frequency}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-black">{habit.icon || '⚡'}</span>
                <span className="text-[0.625rem] font-bold uppercase opacity-40">{habit.category}</span>
              </div>
              <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(habit)}
                  className="flex-1 border border-[#35343a] text-on-surface-variant py-2 text-[0.625rem] font-black uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-container hover:border-primary-container transition-all duration-200 text-center min-h-[44px]"
                >
                  EDIT
                </button>
                <button
                  onClick={() => setDeleting(habit)}
                  aria-label="Delete habit"
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Add new protocol card */}
          <div
            className="col-span-12 sm:col-span-6 lg:col-span-4 bg-surface-container-low/40 p-6 sm:p-8 border border-dashed border-[#35343a]/40 group hover:bg-surface-container-low transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center min-h-[180px] sm:min-h-[200px]"
            onClick={openCreate}
          >
            <span className="material-symbols-outlined text-on-surface-variant/30 mb-4 group-hover:text-primary-container transition-colors" style={{ fontSize: '48px' }}>add</span>
            <h3 className="text-[0.75rem] font-bold text-on-surface-variant/50 uppercase tracking-widest group-hover:text-on-surface-variant transition-colors">
              New Protocol
            </h3>
          </div>
        </section>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-md shadow-2xl shadow-black/60 animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(145deg, rgba(27,27,32,0.98), rgba(19,19,24,0.99))',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#1b1b20] z-10">
              <div>
                <h2 className="font-headline font-bold text-lg text-on-surface uppercase tracking-tighter">
                  {editing ? 'Edit Protocol' : 'New Protocol'}
                </h2>
                <p className="text-on-surface-variant text-xs mt-0.5 uppercase tracking-widest opacity-60">
                  {editing ? 'Modify parameters' : 'Define high-performance habit'}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-container-highest transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 pb-6 pt-5 space-y-5">
              <div>
                <label className="block text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 mb-2 px-1">Protocol Name</label>
                <input
                  className="input"
                  placeholder="e.g. Deep Work Session"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="habit-icon" className="block text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 mb-2 px-1">Symbol</label>
                  <input
                    id="habit-icon"
                    className="input text-2xl text-center"
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    maxLength={2}
                    aria-describedby="habit-icon-hint"
                    placeholder="⚡"
                  />
                  <p id="habit-icon-hint" className="text-[0.625rem] text-on-surface-variant/40 mt-1 px-1 uppercase tracking-widest">Emoji or 1–2 chars</p>
                </div>
                <div>
                  <label className="block text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 mb-2 px-1">Accent</label>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {HABIT_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        aria-label={`Select color ${c}`}
                        aria-pressed={form.color === c}
                        title={c}
                        className={cn('w-7 h-7 transition-all duration-150', form.color === c ? 'ring-2 ring-on-surface ring-offset-2 ring-offset-surface-container-high scale-110' : 'hover:scale-105')}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 mb-2 px-1">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value} style={{ background: '#2a292f' }}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/70 mb-2 px-1">Frequency</label>
                <div className="flex gap-2">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, frequency: f.value }))}
                      className={cn(
                        'flex-1 py-2.5 text-xs font-label font-bold transition-all duration-200 uppercase tracking-widest',
                        form.frequency === f.value
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-error text-xs bg-error/10 border border-error/20 px-3 py-2.5 font-mono">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost bg-surface-container-highest flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Initialise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !deletingInFlight && setDeleting(null)}>
          <div
            role="alertdialog"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
            className="w-full max-w-sm bg-[#1b1b20] border border-error/20 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-white/5">
              <h2 id="delete-title" className="font-bold text-lg text-on-surface uppercase tracking-tighter">Delete Habit</h2>
              <p id="delete-desc" className="text-on-surface-variant text-xs mt-1 opacity-70 leading-relaxed">
                Permanently archive <span className="text-on-surface font-bold">{deleting.name}</span>? Its history will stop counting toward your streaks.
              </p>
            </div>
            <div className="px-6 py-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deletingInFlight}
                className="btn-ghost bg-surface-container-highest flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingInFlight}
                className="flex-1 bg-error text-on-error font-black uppercase tracking-widest text-[0.75rem] py-3 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {deletingInFlight ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMaterialIcon(category) {
  const map = {
    health: 'fitness_center', fitness: 'fitness_center',
    mind: 'psychology', mindfulness: 'self_improvement',
    nutrition: 'water_drop', learning: 'menu_book',
    productivity: 'terminal', sleep: 'bedtime',
  };
  return map[category?.toLowerCase()] || 'bolt';
}
