import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { habitsApi } from '../lib/api';
import { CATEGORIES, HABIT_COLORS, FREQUENCIES, cn } from '../lib/utils';
import {
  Pencil, Trash2, X, Plus, Search, ListChecks, Activity,
  Dumbbell, Brain, BookOpen, Zap, Users, DollarSign, Palette, Sparkles,
} from 'lucide-react';

const CATEGORY_ICON = {
  health: Dumbbell,
  fitness: Dumbbell,
  mindfulness: Brain,
  mind: Brain,
  learning: BookOpen,
  productivity: Zap,
  social: Users,
  finance: DollarSign,
  creative: Palette,
  other: Sparkles,
};

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingInFlight, setDeletingInFlight] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const defaultForm = {
    name: '',
    category: 'health',
    frequency: 'daily',
    color: HABIT_COLORS[0],
    icon: '⚡',
  };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    habitsApi.getAll()
      .then(r => setHabits(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(habit) {
    setEditing(habit);
    setForm({
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency,
      color: habit.color || HABIT_COLORS[0],
      icon: habit.icon || '⚡',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
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
    } finally {
      setSaving(false);
    }
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
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Activity className="text-accent animate-pulse-soft" size={22} />
        <p className="eyebrow">Loading tasks…</p>
      </div>
    );
  }

  const filtered = habits
    .filter(h => filter === 'all' || h.category === filter)
    .filter(h => query.trim() === '' || h.name.toLowerCase().includes(query.toLowerCase()));

  const categoryCount = new Set(habits.map(h => h.category)).size;

  return (
    <div className="px-6 sm:px-10 py-10 max-w-[1280px] mx-auto">

      {/* ── Editorial header ── */}
      <header className="mb-14 sm:mb-20">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="eyebrow mb-4">/ 02 Tasks — your daily index</p>
            <h2 className="display text-[56px] sm:text-[88px] lg:text-[112px] text-ink">
              The<br />
              <span className="italic text-brass">practices</span> you<br />
              tend to.
            </h2>
          </div>
          <button onClick={openCreate} className="btn-primary self-start lg:self-end">
            <Plus size={14} />
            New task
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-rule grid grid-cols-3 gap-4 sm:gap-10 max-w-2xl">
          <HeaderStat num="A" label="Total" value={habits.length} />
          <HeaderStat num="B" label="Categories" value={`${categoryCount}/${CATEGORIES.length}`} />
          <HeaderStat num="C" label="This week" value={FREQUENCIES.find(f => f.value === 'daily') ? 'Daily' : '—'} small />
        </div>
      </header>

      {/* ── Toolbar ── */}
      {habits.length > 0 && (
        <div className="mb-8 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="input pl-9"
              type="search"
              aria-label="Search tasks"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            <FilterPill value="all" current={filter} onClick={() => setFilter('all')}>
              All
            </FilterPill>
            {CATEGORIES
              .filter(c => habits.some(h => h.category === c.value))
              .map(c => (
                <FilterPill key={c.value} value={c.value} current={filter} onClick={() => setFilter(c.value)}>
                  {c.label}
                </FilterPill>
              ))}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {habits.length === 0 ? (
        <div className="bg-paper-2 border border-rule p-16 text-center">
          <p className="eyebrow mb-5">/ Empty index</p>
          <p className="display text-5xl mb-3">
            No <em className="italic text-brass">practices</em> yet.
          </p>
          <p className="text-sm text-slate mb-8 max-w-md mx-auto leading-relaxed">
            Start with one small, consistent habit — a page a day, a ten-minute walk.
            You can always add more.
          </p>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={14} />
            Create your first task
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-paper-2 border border-rule p-12 text-center">
          <p className="eyebrow mb-2">/ No matches</p>
          <p className="font-serif text-2xl">Nothing found.</p>
          <p className="text-sm text-slate mt-2">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-rule border border-rule">
          {filtered.map((habit, i) => (
            <HabitCard
              key={habit.id}
              index={i}
              habit={habit}
              onEdit={() => openEdit(habit)}
              onDelete={() => setDeleting(habit)}
            />
          ))}

          {/* Add tile */}
          <button
            onClick={openCreate}
            className="bg-paper hover:bg-paper-2 transition-colors p-6 flex flex-col items-center justify-center text-slate hover:text-ink group min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-rule-strong group-hover:border-accent flex items-center justify-center mb-3 transition-colors">
              <Plus size={18} className="group-hover:text-accent" />
            </div>
            <span className="font-serif text-lg italic text-brass">Add another</span>
            <span className="eyebrow text-[10px] mt-1">/ New</span>
          </button>
        </div>
      )}

      {/* ── Create / edit modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-paper border border-rule rounded-md shadow-elevated animate-slide-up max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-5 border-b border-rule-soft shrink-0">
              <div>
                <p className="eyebrow mb-1">
                  / {editing ? '02A Edit' : '02A New'} — task definition
                </p>
                <h2 className="font-serif text-2xl leading-tight tracking-tight">
                  {editing ? 'Edit a' : 'Define a'}{' '}
                  <em className="italic text-brass">practice.</em>
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="btn-ghost h-8 w-8 px-0 shrink-0 -mr-1"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-5 overflow-y-auto">
              <div>
                <label htmlFor="task-name" className="label">/ A Name</label>
                <input
                  id="task-name"
                  className="input"
                  placeholder="e.g. Morning reading"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-icon" className="label">/ B Icon</label>
                  <input
                    id="task-icon"
                    className="input text-center text-xl font-serif"
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    maxLength={2}
                    placeholder="⚡"
                  />
                </div>
                <div>
                  <label className="label">/ C Accent</label>
                  <div className="flex gap-1.5 flex-wrap items-center h-10">
                    {HABIT_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        aria-label={`Select color ${c}`}
                        aria-pressed={form.color === c}
                        title={c}
                        className={cn(
                          'w-6 h-6 rounded-sm transition-all duration-150',
                          form.color === c
                            ? 'ring-2 ring-offset-2 ring-offset-paper ring-accent scale-110'
                            : 'hover:scale-105 opacity-70 hover:opacity-100'
                        )}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="task-category" className="label">/ D Category</label>
                <select
                  id="task-category"
                  className="select"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">/ E Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, frequency: f.value }))}
                      className={cn(
                        'h-10 rounded-sm font-mono text-[11px] uppercase tracking-tracked-tight transition-colors duration-100 border',
                        form.frequency === f.value
                          ? 'bg-accent text-paper border-accent'
                          : 'bg-paper text-slate border-rule hover:border-rule-strong hover:text-ink'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-danger bg-danger-soft border border-danger/30 px-3 py-2 rounded-sm font-mono uppercase tracking-tracked-tight" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-rule-soft">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleting && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => !deletingInFlight && setDeleting(null)}
        >
          <div
            role="alertdialog"
            aria-labelledby="delete-title"
            className="w-full max-w-md bg-paper border border-rule rounded-md shadow-elevated animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-rule-soft">
              <p className="eyebrow mb-2">/ Confirm deletion</p>
              <h2 id="delete-title" className="font-serif text-2xl leading-tight">
                Remove <em className="italic text-brass">{deleting.name}?</em>
              </h2>
              <p className="text-sm text-slate mt-3 leading-relaxed">
                This permanently deletes the task. Its history will stop counting toward your streaks.
              </p>
            </div>
            <div className="px-6 py-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deletingInFlight}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingInFlight}
                className="btn-danger"
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

function HabitCard({ habit, index, onEdit, onDelete }) {
  const Icon = CATEGORY_ICON[habit.category?.toLowerCase()] || Sparkles;
  const accent = habit.color || '#1E3A5F';

  return (
    <div className="group bg-paper hover:bg-paper-2/70 transition-colors p-6 min-h-[220px] flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-tracked-tight text-slate-soft tabular-nums">
            {String(index + 1).padStart(2, '0')}.
          </span>
          <div
            className="w-9 h-9 rounded-sm flex items-center justify-center"
            style={{ background: `${accent}1a`, color: accent }}
          >
            <Icon size={16} />
          </div>
        </div>
        <span className="badge capitalize">{habit.frequency}</span>
      </div>

      <h3 className="font-serif text-2xl leading-tight tracking-tight mb-2 line-clamp-2">
        {habit.name}
      </h3>
      <p className="eyebrow text-[10px] capitalize mb-auto">{habit.category}</p>

      <div className="mt-5 pt-4 border-t border-rule-soft flex items-center justify-between">
        <span className="font-serif text-2xl italic text-brass leading-none">
          {habit.icon || '⚡'}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            aria-label={`Edit ${habit.name}`}
            className="btn-ghost h-8 w-8 px-0"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Delete ${habit.name}`}
            className="h-8 w-8 rounded-sm flex items-center justify-center text-slate hover:text-danger hover:bg-danger-soft transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ value, current, onClick, children }) {
  const active = value === current;
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-10 px-4 rounded-sm font-mono text-[11px] uppercase tracking-tracked-tight whitespace-nowrap transition-colors duration-100',
        active
          ? 'bg-accent text-paper'
          : 'text-slate hover:text-ink hover:bg-paper-2'
      )}
    >
      {children}
    </button>
  );
}

function HeaderStat({ num, label, value, small }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="font-mono text-[10px] text-brass uppercase tracking-tracked-tight">{num}.</span>
        <span className="eyebrow">{label}</span>
      </div>
      <p className={cn(
        'font-serif leading-none tabular-nums',
        small ? 'text-xl' : 'text-3xl',
      )}>
        {value}
      </p>
    </div>
  );
}
