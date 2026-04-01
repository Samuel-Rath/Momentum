import { useState, useEffect, useCallback } from 'react';
import { logsApi, analyticsApi } from '../lib/api';
import { getTodayString, cn } from '../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

function useCountdownAEST() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calc() {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Sydney',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false,
      }).formatToParts(now);

      const hour = parseInt(parts.find(p => p.type === 'hour').value) % 24;
      const minute = parseInt(parts.find(p => p.type === 'minute').value);
      const second = parseInt(parts.find(p => p.type === 'second').value);

      const secsNow = hour * 3600 + minute * 60 + second;
      const secsLeft = (86400 - secsNow) % 86400;

      const h = Math.floor(secsLeft / 3600);
      const m = Math.floor((secsLeft % 3600) / 60);
      const s = secsLeft % 60;

      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

export default function Dashboard() {
  const today = getTodayString();
  const countdown = useCountdownAEST();

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

  useEffect(() => { fetchToday(); }, [fetchToday]);

  async function toggleHabit(habit) {
    const newCompleted = !(habit.log?.completed ?? false);
    setHabits(prev =>
      prev.map(h => h.id === habit.id ? { ...h, log: { ...(h.log || {}), completed: newCompleted } } : h)
    );
    try {
      await logsApi.upsert({ habitId: habit.id, date: today, completed: newCompleted, notes: habit.log?.notes || noteInputs[habit.id] || null });
      const res = await analyticsApi.streaks();
      setStreaks(res.data);
    } catch { fetchToday(); }
  }

  async function saveNote(habit) {
    const notes = noteInputs[habit.id] || '';
    try {
      await logsApi.upsert({ habitId: habit.id, date: today, completed: habit.log?.completed ?? false, notes });
      setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, log: { ...(h.log || {}), notes } } : h));
    } catch (err) { console.error(err); }
  }

  const completed = habits.filter(h => h.log?.completed).length;
  const total = habits.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const topStreak = streaks.reduce((max, s) => (s.currentStreak > (max?.currentStreak || 0) ? s : max), null);
  const streakMultiplier = topStreak?.currentStreak
    ? (1 + topStreak.currentStreak * 0.08).toFixed(1)
    : '1.0';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500", fontSize: '36px' }}>bolt</span>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest">Initialising…</p>
      </div>
    );
  }

  return (
    <div className="pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 max-w-7xl mx-auto">

      {/* Stats row — 12-col bento */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6 mb-8 sm:mb-12">

        {/* Velocity — col 5 */}
        <div className="col-span-12 lg:col-span-5 bg-surface-container-low p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined" style={{ fontSize: '8rem', fontVariationSettings: "'FILL' 0" }}>speed</span>
          </div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-primary mb-2">CURRENT VELOCITY</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-[3rem] sm:text-[4rem] font-black tracking-tighter leading-none">{topStreak?.currentStreak ?? 0}</h2>
            <span className="text-xl font-bold text-on-surface-variant uppercase tracking-widest">DAYS</span>
          </div>
          <div className="mt-6 h-1 w-full bg-surface-container-highest">
            <div
              className="h-full bg-primary-container shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-700"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
          <p className="mt-4 text-[0.6875rem] font-medium text-on-surface-variant opacity-60 uppercase tracking-widest">
            {progress}% PROTOCOL COMPLETION
          </p>
        </div>

        {/* Multiplier — col 4 */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-surface-container-low p-6 sm:p-8 border-l border-primary-container/20">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-secondary mb-2">STREAK MULTIPLIER</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-[3rem] sm:text-[4rem] font-black tracking-tighter leading-none text-secondary">
              {streakMultiplier}<span className="text-2xl italic">x</span>
            </h2>
            <span className="text-xl font-bold text-on-surface-variant uppercase tracking-widest">XP</span>
          </div>
          <div className="mt-8 flex gap-2">
            <div className="flex-1 h-12 bg-secondary/10 flex items-center justify-center border border-secondary/20">
              <span className="text-[0.625rem] font-black text-secondary uppercase tracking-widest">
                {topStreak?.currentStreak > 0 ? 'ACTIVE FLOW' : 'DORMANT'}
              </span>
            </div>
            <div className="flex-1 h-12 bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
          </div>
        </div>

        {/* Trend chart — col 3 */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface-container-low p-6 sm:p-8">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-6">MOMENTUM TREND</p>
          <div className="flex items-end justify-between h-24 gap-1">
            <div className="w-full bg-surface-container-highest" style={{ height: '40%' }} />
            <div className="w-full bg-surface-container-highest" style={{ height: '65%' }} />
            <div className="w-full bg-surface-container-highest" style={{ height: '55%' }} />
            <div className="w-full bg-primary-container" style={{ height: '90%' }} />
            <div className="w-full bg-primary-container" style={{ height: '85%' }} />
            <div className="w-full bg-primary-container shadow-[0_0_10px_rgba(249,115,22,0.3)]" style={{ height: '100%' }} />
            <div className="w-full border-t-2 border-primary-container" style={{ height: 0 }} />
          </div>
          <div className="flex justify-between mt-4 text-[0.625rem] font-bold text-on-surface-variant opacity-40 tracking-widest">
            <span>MON</span>
            <span>SUN</span>
          </div>
        </div>
      </div>

      {/* Content row */}
      <div className="grid grid-cols-12 gap-6 sm:gap-8">

        {/* Protocol checklist — col 7 */}
        <div className="col-span-12 lg:col-span-7 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-surface-container-highest pb-4 gap-3">
            <h3 className="text-xl sm:text-2xl font-black tracking-tighter uppercase">TODAY'S PROTOCOL</h3>
            <div className="flex items-center gap-4 flex-wrap">
              {countdown && (
                <div className="text-right">
                  <p className="text-[0.5rem] font-bold uppercase tracking-widest text-on-surface-variant/40 leading-none mb-1">Day Resets AEST</p>
                  <p className="text-[0.9375rem] font-black tracking-tighter text-primary-container tabular-nums font-mono">{countdown}</p>
                </div>
              )}
              <span className="text-[0.6875rem] font-bold text-primary-container tracking-[0.2em]">
                {completed} / {total} COMPLETE
              </span>
            </div>
          </div>

          {habits.length === 0 ? (
            <div className="bg-surface-container-low p-8 sm:p-12 text-center">
              <span className="material-symbols-outlined text-on-surface-variant/30 block mb-4" style={{ fontSize: '48px' }}>add_task</span>
              <p className="font-black text-lg text-on-surface uppercase tracking-tighter">No protocols loaded</p>
              <p className="text-on-surface-variant text-xs mt-2 mb-6 uppercase tracking-widest opacity-60">
                Initialise a habit to begin tracking
              </p>
              <Link to="/habits" className="btn-primary inline-block">Initialise Protocol</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map(habit => {
                const done = habit.log?.completed ?? false;
                const notesOpen = expandedNotes[habit.id];
                const streak = streaks.find(s => s.id === habit.id);

                return (
                  <div key={habit.id}>
                    <div
                      className={cn(
                        'group flex items-center justify-between p-4 sm:p-6 transition-all duration-200 cursor-pointer',
                        done
                          ? 'bg-surface-container-highest/40 hover:bg-surface-container-highest'
                          : 'bg-surface-container-low hover:bg-surface-container-highest'
                      )}
                    >
                      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                        <button
                          onClick={() => toggleHabit(habit)}
                          className="shrink-0 transition-transform active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {done ? (
                            <div className="w-6 h-6 border-2 border-primary-container bg-primary-container flex items-center justify-center">
                              <span className="material-symbols-outlined text-on-primary font-bold" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-on-surface-variant/30 group-hover:border-primary-container transition-colors" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4 className={cn('text-base sm:text-lg font-bold leading-none mb-1 truncate', done && 'opacity-40')}>{habit.name}</h4>
                          <p className="text-[0.6875rem] font-medium text-on-surface-variant opacity-50 uppercase tracking-widest truncate">
                            {habit.category?.toUpperCase()}
                            {streak?.currentStreak > 0 && ` • ${streak.currentStreak} DAY STREAK`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={cn('material-symbols-outlined hidden sm:block', done ? 'text-tertiary' : 'text-on-surface-variant/30 group-hover:text-primary-container')}
                          style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          {getCategoryIcon(habit.category)}
                        </span>
                        <button
                          onClick={() => setExpandedNotes(p => ({ ...p, [habit.id]: !p[habit.id] }))}
                          className="text-on-surface-variant hover:text-on-surface transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          {notesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>
                    {notesOpen && (
                      <div className="bg-surface-container-lowest p-3 sm:p-4 flex gap-2 border-t border-surface-container-highest">
                        <input
                          className="input text-xs py-2"
                          placeholder="Log execution notes…"
                          value={noteInputs[habit.id] ?? habit.log?.notes ?? ''}
                          onChange={e => setNoteInputs(p => ({ ...p, [habit.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && saveNote(habit)}
                        />
                        <button onClick={() => saveNote(habit)} className="btn-primary px-3 sm:px-4 py-2 text-xs whitespace-nowrap">
                          Log
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance insights — col 5 */}
        <div className="col-span-12 lg:col-span-5 space-y-6 sm:space-y-8">
          <div className="flex justify-between items-end border-b border-surface-container-highest pb-4">
            <h3 className="text-xl sm:text-2xl font-black tracking-tighter uppercase">PERFORMANCE INSIGHTS</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-surface-container-low aspect-square p-4 sm:p-6 flex flex-col justify-between">
              <span className="material-symbols-outlined text-primary-container">psychology</span>
              <div>
                <p className="text-[2.5rem] sm:text-[3rem] font-black leading-none mb-2">{progress}<span className="text-lg">%</span></p>
                <p className="text-[0.625rem] font-bold text-on-surface-variant uppercase tracking-widest">FOCUS COGNITION</p>
              </div>
            </div>
            <div className="bg-surface-container-low aspect-square p-4 sm:p-6 flex flex-col justify-between border-t-2 border-secondary/30">
              <span className="material-symbols-outlined text-secondary">bedtime</span>
              <div>
                <p className="text-[2.5rem] sm:text-[3rem] font-black leading-none mb-2">{completed}<span className="text-lg">/{total}</span></p>
                <p className="text-[0.625rem] font-bold text-on-surface-variant uppercase tracking-widest">PROTOCOLS DONE</p>
              </div>
            </div>
            <div className="col-span-2 bg-surface-container-low p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-tertiary">trending_up</span>
              </div>
              <div>
                <h5 className="font-bold text-sm uppercase tracking-widest mb-1">
                  {progress >= 80 ? 'SYSTEM OPTIMISED' : progress >= 50 ? 'ON TRACK' : 'BUILD MOMENTUM'}
                </h5>
                <p className="text-[0.6875rem] text-on-surface-variant opacity-60 leading-relaxed uppercase">
                  {topStreak?.currentStreak > 0
                    ? `${topStreak.name} streak at ${topStreak.currentStreak} days. Keep the chain alive.`
                    : 'Complete your first protocol to start building momentum.'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 sm:p-6 border-l-2 border-primary-container/40">
            <p className="text-[0.625rem] font-black text-primary-container uppercase tracking-[0.3em] mb-2">NEXT MILESTONE</p>
            <h4 className="text-lg sm:text-xl font-bold uppercase tracking-tighter">
              {topStreak?.currentStreak >= 21
                ? 'ELITE MOMENTUM ACHIEVED'
                : `ELITE MOMENTUM (${21 - (topStreak?.currentStreak || 0)} DAYS)`}
            </h4>
            <p className="text-[0.6875rem] text-on-surface-variant opacity-50 mt-2 uppercase tracking-widest">
              {topStreak?.currentStreak > 0
                ? `${topStreak.name} • DAY ${topStreak.currentStreak}`
                : 'START YOUR FIRST STREAK'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(category) {
  const map = {
    health: 'fitness_center', fitness: 'fitness_center',
    mind: 'psychology', mindfulness: 'self_improvement',
    nutrition: 'water_drop', learning: 'terminal',
    productivity: 'terminal', sleep: 'bedtime',
  };
  return map[category?.toLowerCase()] || 'bolt';
}
