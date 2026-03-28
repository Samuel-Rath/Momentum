import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { logsApi, analyticsApi } from '../lib/api';
import { getTodayString, formatDisplayDate, cn } from '../lib/utils';
import { CheckCircle2, Circle, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const today = getTodayString();

  const [habits, setHabits] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [noteInputs, setNoteInputs] = useState({});

  const fetchToday = useCallback(async () => {
    try {
      const [logsRes, streaksRes] = await Promise.all([
        logsApi.getByDate(today),
        analyticsApi.streaks(),
      ]);
      setHabits(logsRes.data);
      setStreaks(streaksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  async function toggleHabit(habit) {
    const newCompleted = !(habit.log?.completed ?? false);
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? { ...h, log: { ...(h.log || {}), completed: newCompleted } }
          : h
      )
    );
    try {
      await logsApi.upsert({
        habitId: habit.id,
        date: today,
        completed: newCompleted,
        notes: habit.log?.notes || noteInputs[habit.id] || null,
      });
      // Refresh streaks silently
      const res = await analyticsApi.streaks();
      setStreaks(res.data);
    } catch {
      fetchToday();
    }
  }

  async function saveNote(habit) {
    const notes = noteInputs[habit.id] || '';
    try {
      await logsApi.upsert({
        habitId: habit.id,
        date: today,
        completed: habit.log?.completed ?? false,
        notes,
      });
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, log: { ...(h.log || {}), notes } } : h
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  const completed = habits.filter((h) => h.log?.completed).length;
  const total = habits.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const topStreak = streaks.reduce((max, s) => (s.currentStreak > (max?.currentStreak || 0) ? s : max), null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-accent text-3xl animate-pulse">🔥</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <p className="text-muted text-sm font-medium">{formatDisplayDate(today)}</p>
        <h1 className="text-3xl font-bold text-white mt-1">
          {getGreeting()}, {user?.username} 👋
        </h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-muted text-sm">Today's Progress</p>
          <p className="text-3xl font-bold text-white mt-1">
            {completed}<span className="text-muted text-xl">/{total}</span>
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-accent text-xs font-semibold mt-1.5">{progress}% done</p>
        </div>

        <div className="card">
          <p className="text-muted text-sm">Top Streak</p>
          <p className="text-3xl font-bold text-white mt-1 flex items-center gap-2">
            {topStreak?.currentStreak ?? 0}
            <span className={cn('text-2xl', topStreak?.currentStreak > 0 && 'animate-pulse')}>🔥</span>
          </p>
          <p className="text-muted text-xs mt-1.5 truncate">{topStreak?.name || 'No active streak'}</p>
        </div>

        <div className="card">
          <p className="text-muted text-sm">Completion</p>
          <p className="text-3xl font-bold mt-1" style={{ color: progress >= 70 ? '#22C55E' : progress >= 40 ? '#F97316' : '#EF4444' }}>
            {progress}%
          </p>
          <p className="text-muted text-xs mt-1.5">
            {progress === 100 ? '🏆 Perfect day!' : progress >= 70 ? '💪 Strong day' : progress >= 40 ? '⚡ Keep going' : '🎯 You can do this'}
          </p>
        </div>
      </div>

      {/* Habit check-in */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Today's Habits</h2>
        {habits.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-white font-semibold">No habits yet</p>
            <p className="text-muted text-sm mt-1">
              <Link to="/habits" className="text-accent hover:underline">Add your first habit</Link> to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const done = habit.log?.completed ?? false;
              const streak = streaks.find((s) => s.id === habit.id);
              const notesOpen = expandedNotes[habit.id];

              return (
                <div
                  key={habit.id}
                  className={cn(
                    'card transition-all duration-200',
                    done && 'border-success/30 bg-success/5'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleHabit(habit)}
                      className="shrink-0 transition-transform active:scale-90"
                    >
                      {done ? (
                        <CheckCircle2 size={28} className="text-success" />
                      ) : (
                        <Circle size={28} className="text-muted hover:text-white transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{habit.icon || '✅'}</span>
                        <span className={cn('font-semibold text-white', done && 'line-through text-muted')}>
                          {habit.name}
                        </span>
                        <span
                          className="badge text-white/70"
                          style={{ background: `${habit.color || '#F97316'}20`, border: `1px solid ${habit.color || '#F97316'}40` }}
                        >
                          {habit.category}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {streak?.currentStreak > 0 && (
                        <div className="flex items-center gap-1 text-accent">
                          <Flame size={14} />
                          <span className="text-xs font-bold">{streak.currentStreak}</span>
                        </div>
                      )}
                      <button
                        onClick={() =>
                          setExpandedNotes((p) => ({ ...p, [habit.id]: !p[habit.id] }))
                        }
                        className="text-muted hover:text-white transition-colors p-1"
                        title="Add note"
                      >
                        {notesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {notesOpen && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex gap-2">
                        <input
                          className="input text-sm py-2"
                          placeholder="Add a note... (e.g. ran 3km)"
                          value={noteInputs[habit.id] ?? habit.log?.notes ?? ''}
                          onChange={(e) =>
                            setNoteInputs((p) => ({ ...p, [habit.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && saveNote(habit)}
                        />
                        <button
                          onClick={() => saveNote(habit)}
                          className="btn-primary px-3 py-2 text-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Streak summary */}
      {streaks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Streak Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {streaks.map((s) => (
              <div key={s.id} className="card text-center py-4">
                <div className="text-2xl mb-1">{s.icon || '⚡'}</div>
                <p className="text-xs text-muted font-medium truncate px-1">{s.name}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {s.currentStreak}
                  <span className="text-accent text-sm ml-1">🔥</span>
                </p>
                <p className="text-xs text-muted">best: {s.longestStreak}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
