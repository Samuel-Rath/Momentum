import { useState, useEffect } from 'react';
import { habitsApi } from '../lib/api';
import { CATEGORIES, HABIT_COLORS, FREQUENCIES, cn } from '../lib/utils';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const defaultForm = {
    name: '',
    category: 'health',
    frequency: 'daily',
    color: HABIT_COLORS[0],
    icon: '✅',
  };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    habitsApi.getAll()
      .then((r) => setHabits(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
      icon: habit.icon || '✅',
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
        setHabits((p) => p.map((h) => (h.id === editing.id ? res.data : h)));
      } else {
        const res = await habitsApi.create(form);
        setHabits((p) => [...p, res.data]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this habit?')) return;
    await habitsApi.remove(id);
    setHabits((p) => p.filter((h) => h.id !== id));
  }

  const categories = ['all', ...new Set(habits.map((h) => h.category))];
  const filtered =
    filterCategory === 'all' ? habits : habits.filter((h) => h.category === filterCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-accent text-3xl animate-pulse">🔥</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Habits</h1>
          <p className="text-muted mt-1">{habits.length} habit{habits.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Habit
        </button>
      </div>

      {/* Category filter */}
      {habits.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                filterCategory === cat
                  ? 'bg-accent text-white'
                  : 'bg-elevated text-muted hover:text-white border border-border'
              )}
            >
              {cat === 'all' ? 'All' : `${getCategoryIcon(cat)} ${capitalize(cat)}`}
            </button>
          ))}
        </div>
      )}

      {/* Habit list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">⚡</p>
          <p className="text-white font-semibold text-lg">
            {habits.length === 0 ? 'Create your first habit' : 'No habits in this category'}
          </p>
          <p className="text-muted text-sm mt-1 mb-4">
            {habits.length === 0 && 'Start with something small and build from there.'}
          </p>
          {habits.length === 0 && (
            <button onClick={openCreate} className="btn-primary">
              <Plus size={16} className="inline mr-1" />
              Add Habit
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((habit) => (
            <div key={habit.id} className="card flex items-center gap-4 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${habit.color || '#F97316'}20`, border: `1px solid ${habit.color || '#F97316'}30` }}
              >
                {habit.icon || '✅'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{habit.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-muted text-xs">{getCategoryIcon(habit.category)} {capitalize(habit.category)}</span>
                  <span className="text-border">·</span>
                  <span className="text-muted text-xs">{capitalize(habit.frequency)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(habit)}
                  className="p-2 text-muted hover:text-white hover:bg-elevated rounded-lg transition-all"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-white">
                {editing ? 'Edit Habit' : 'New Habit'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted hover:text-white p-1 rounded-lg hover:bg-elevated"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Habit Name</label>
                <input
                  className="input"
                  placeholder="e.g. Morning Workout"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              {/* Icon + Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Icon (emoji)</label>
                  <input
                    className="input text-2xl"
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Color</label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {HABIT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className={cn(
                          'w-7 h-7 rounded-full transition-transform',
                          form.color === c && 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110'
                        )}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} style={{ background: '#1A1A27' }}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Frequency</label>
                <div className="flex gap-2">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, frequency: f.value }))}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                        form.frequency === f.value
                          ? 'bg-accent/10 border-accent/30 text-accent'
                          : 'border-border text-muted hover:text-white hover:bg-elevated'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost flex-1 border border-border"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function capitalize(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}

function getCategoryIcon(cat) {
  const found = CATEGORIES.find((c) => c.value === cat);
  return found?.icon || '✨';
}
