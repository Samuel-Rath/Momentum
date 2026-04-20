import { useState, useEffect, useCallback } from 'react';
import { logsApi, analyticsApi } from '../lib/api';
import { getTodayString, cn, formatDisplayDate } from '../lib/utils';
import {
  Check, ChevronDown, ChevronUp, Flame, Plus, CheckCircle2,
  Activity, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

function useCountdownLocal() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calc() {
      const now = new Date();
      const secsNow = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
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
  const countdown = useCountdownLocal();

  const [habits, setHabits] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [weekCompletion, setWeekCompletion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [noteSaved, setNoteSaved] = useState({});

  const fetchToday = useCallback(async () => {
    try {
      const [logsRes, streaksRes, completionRes] = await Promise.all([
        logsApi.getByDate(today),
        analyticsApi.streaks(),
        analyticsApi.completion('week'),
      ]);
      setHabits(logsRes.data);
      setStreaks(streaksRes.data);
      setWeekCompletion(completionRes.data);
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
      await logsApi.upsert({
        habitId: habit.id,
        date: today,
        completed: newCompleted,
        notes: habit.log?.notes || noteInputs[habit.id] || null,
      });
      const [streaksRes, completionRes] = await Promise.all([
        analyticsApi.streaks(),
        analyticsApi.completion('week'),
      ]);
      setStreaks(streaksRes.data);
      setWeekCompletion(completionRes.data);
    } catch { fetchToday(); }
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
      setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, log: { ...(h.log || {}), notes } } : h));
      setNoteSaved(p => ({ ...p, [habit.id]: true }));
      setTimeout(() => setNoteSaved(p => ({ ...p, [habit.id]: false })), 2000);
    } catch (err) { console.error(err); }
  }

  const completed = habits.filter(h => h.log?.completed).length;
  const total = habits.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const topStreak = streaks.reduce((max, s) => (s.currentStreak > (max?.currentStreak || 0) ? s : max), null);
  const longestEver = streaks.reduce((max, s) => Math.max(max, s.longestStreak || 0), 0);
  const activeStreaks = streaks.filter(s => s.currentStreak > 0).length;

  const trendData = weekCompletion.length > 0
    ? weekCompletion.map((d, i) => ({
        day: d.label?.split(',')[0]?.slice(0, 3) || `D${i + 1}`,
        rate: d.total === 0 ? 0 : d.rate,
        total: d.total,
      }))
    : Array(7).fill(0).map((_, i) => ({ day: `D${i + 1}`, rate: 0, total: 0 }));

  const weekAvg = trendData.length
    ? Math.round(trendData.filter(d => d.total > 0).reduce((s, d) => s + d.rate, 0) /
        Math.max(1, trendData.filter(d => d.total > 0).length))
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Activity className="text-accent animate-pulse-soft" size={22} />
        <p className="eyebrow">Loading overview…</p>
      </div>
    );
  }

  const todayFull = formatDisplayDate(today);
  const todayParts = todayFull.split(','); // "Monday, April 20"

  return (
    <div className="px-6 sm:px-10 py-10 max-w-[1280px] mx-auto">

      {/* ── Editorial header ── */}
      <header className="mb-14 sm:mb-20">
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-12 lg:col-span-8">
            <p className="eyebrow mb-4">/ 01 Overview — {todayFull}</p>
            <h2 className="display text-[56px] sm:text-[88px] lg:text-[112px] text-ink">
              {greeting()},<br />
              <span className="italic text-brass">ready for today?</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4 flex lg:justify-end">
            <div className="grid grid-cols-2 gap-6 sm:gap-10 w-full lg:max-w-xs">
              <HeaderStat num="A" label="Tasks done" value={`${completed}/${total || 0}`} />
              <HeaderStat num="B" label="Day resets in" value={countdown || '—'} mono />
            </div>
          </div>
        </div>
      </header>

      {/* ── KPI row ── */}
      <section className="mb-14 sm:mb-20">
        <SectionHeader num="02" title="At a" italic="glance." trailing="" hint="Signals from today and this week." />

        <div className="grid grid-cols-12 gap-[1px] bg-rule border border-rule">
          <KpiCell
            num="01"
            label="Today's progress"
            value={`${progress}`}
            unit="%"
            hint={`${completed} of ${total || 0} complete`}
            bar={progress}
            span="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <KpiCell
            num="02"
            label="Current streak"
            value={topStreak?.currentStreak ?? 0}
            unit="days"
            hint={topStreak?.name ? `in ${topStreak.name}` : 'No active streak'}
            italic
            span="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <KpiCell
            num="03"
            label="Weekly average"
            value={`${weekAvg}`}
            unit="%"
            hint="Last 7 days"
            span="col-span-12 sm:col-span-6 lg:col-span-3"
          />
          <KpiCell
            num="04"
            label="Active streaks"
            value={activeStreaks}
            unit=""
            hint={longestEver > 0 ? `Longest ever ${longestEver}d` : 'Build your first'}
            span="col-span-12 sm:col-span-6 lg:col-span-3"
          />
        </div>
      </section>

      {/* ── Trend chart + Progress ring ── */}
      <section className="mb-14 sm:mb-20">
        <SectionHeader num="03" title="The" italic="shape" trailing="of your week." hint="Completion rate, day by day." />

        <div className="grid grid-cols-12 gap-[1px] bg-rule border border-rule">
          {/* Chart */}
          <div className="col-span-12 lg:col-span-8 bg-paper p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="eyebrow">/ 03A Completion trend</p>
                <p className="font-serif text-lg mt-1">Last 7 days</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-[44px] leading-none tabular-nums">{weekAvg}<span className="text-xl text-slate">%</span></p>
                <p className="eyebrow mt-1">Avg</p>
              </div>
            </div>

            <div className="h-56 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E3A5F" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6CFBE" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={{ stroke: '#D6CFBE' }}
                    tick={{ fill: '#5E6A77', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    dy={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#8A939E', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={v => `${v}`}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ stroke: '#1E3A5F', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{
                      background: '#F3F1EB',
                      border: '1px solid #D6CFBE',
                      borderRadius: '2px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                      color: '#0F1823',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                    labelStyle={{ color: '#5E6A77', marginBottom: 2 }}
                    formatter={(v) => [`${v}%`, 'Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#1E3A5F"
                    strokeWidth={1.5}
                    fill="url(#trendFill)"
                    dot={{ fill: '#1E3A5F', r: 3 }}
                    activeDot={{ r: 5, fill: '#8A6F3D' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress ring */}
          <div className="col-span-12 lg:col-span-4 bg-paper p-6 sm:p-8 flex flex-col">
            <p className="eyebrow">/ 03B Today</p>
            <p className="font-serif text-lg mt-1 mb-6">{todayParts[0]}</p>

            <div className="flex-1 flex items-center justify-center py-4">
              <ProgressRing value={progress} />
            </div>

            <div className="grid grid-cols-2 gap-[1px] bg-rule border border-rule mt-2">
              <div className="bg-paper p-3 text-center">
                <p className="eyebrow text-[10px]">Done</p>
                <p className="font-serif text-2xl mt-1 tabular-nums text-success">{completed}</p>
              </div>
              <div className="bg-paper p-3 text-center">
                <p className="eyebrow text-[10px]">Left</p>
                <p className="font-serif text-2xl mt-1 tabular-nums">{Math.max(0, total - completed)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Today's tasks + Top streaks ── */}
      <section className="mb-14 sm:mb-20">
        <SectionHeader
          num="04"
          title="Today's"
          italic="practice."
          hint={`${completed} of ${total || 0} complete.`}
          action={<Link to="/habits" className="eyebrow-accent inline-flex items-center gap-1 hover:text-accent">Manage <ArrowRight size={11} /></Link>}
        />

        <div className="grid grid-cols-12 gap-[1px] bg-rule border border-rule">
          {/* Tasks list */}
          <div className="col-span-12 lg:col-span-8 bg-paper">
            {habits.length === 0 ? (
              <div className="p-16 text-center">
                <p className="eyebrow mb-4">/ Empty</p>
                <p className="font-serif text-3xl leading-tight mb-2">
                  No <em className="italic text-brass">practices</em> yet.
                </p>
                <p className="text-sm text-slate mb-6 max-w-xs mx-auto">
                  Add your first habit to start tracking — one small step is enough.
                </p>
                <Link to="/habits?new=1" className="btn-primary">
                  <Plus size={14} />
                  Create a task
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-rule-soft">
                {habits.map((habit, i) => {
                  const done = habit.log?.completed ?? false;
                  const notesOpen = expandedNotes[habit.id];
                  const streak = streaks.find(s => s.id === habit.id);

                  return (
                    <li key={habit.id} className="group">
                      <div className="grid grid-cols-[48px_28px_1fr_auto_40px] items-center gap-3 px-5 sm:px-6 py-4 hover:bg-paper-2/50 transition-colors">
                        <span className="font-mono text-[10px] text-slate-soft uppercase tracking-tracked-tight tabular-nums">
                          {String(i + 1).padStart(2, '0')}.
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleHabit(habit)}
                          aria-pressed={done}
                          aria-label={`${done ? 'Completed' : 'Mark complete'}: ${habit.name}`}
                          className="justify-self-start shrink-0 h-7 w-7 rounded-sm flex items-center justify-center hover:bg-paper-3 transition-colors"
                        >
                          {done ? (
                            <div className="w-5 h-5 rounded-sm bg-accent flex items-center justify-center">
                              <Check size={12} className="text-paper" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-sm border border-slate-soft hover:border-accent transition-colors" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleHabit(habit)}
                          className="min-w-0 text-left"
                        >
                          <p className={cn(
                            'font-serif text-xl leading-tight truncate transition-all',
                            done && 'text-slate-soft line-through decoration-rule'
                          )}>
                            {habit.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="eyebrow text-[10px] capitalize">{habit.category}</span>
                            {streak?.currentStreak > 0 && (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-tracked-tight text-brass">
                                <Flame size={10} />
                                {streak.currentStreak}d
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="hidden sm:flex items-center">
                          {done && (
                            <span className="badge-success">Done</span>
                          )}
                        </div>

                        <button
                          onClick={() => setExpandedNotes(p => ({ ...p, [habit.id]: !p[habit.id] }))}
                          className="btn-ghost h-8 w-8 px-0 justify-self-end"
                          aria-label={notesOpen ? 'Hide notes' : 'Show notes'}
                          aria-expanded={notesOpen}
                        >
                          {notesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {notesOpen && (
                        <div className="bg-paper-2/60 px-5 sm:px-6 py-4 border-t border-rule-soft">
                          <label className="label">/ Note</label>
                          <div className="flex gap-2">
                            <input
                              className="input input-sm flex-1"
                              placeholder="A line or two…"
                              aria-label={`Note for ${habit.name}`}
                              value={noteInputs[habit.id] ?? habit.log?.notes ?? ''}
                              onChange={e => setNoteInputs(p => ({ ...p, [habit.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && saveNote(habit)}
                            />
                            <button onClick={() => saveNote(habit)} className="btn-secondary h-9 px-3 text-xs">
                              Save
                            </button>
                          </div>
                          {noteSaved[habit.id] && (
                            <p className="mt-2 font-mono text-[10px] uppercase tracking-tracked-tight text-success flex items-center gap-1" role="status">
                              <CheckCircle2 size={11} />
                              Saved
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Top streaks */}
          <div className="col-span-12 lg:col-span-4 bg-paper p-6 sm:p-8">
            <p className="eyebrow mb-1">/ 04B Top streaks</p>
            <p className="font-serif text-lg mb-6">Kept in motion.</p>

            {streaks.filter(s => s.currentStreak > 0).length === 0 ? (
              <div className="text-center py-10 border-t border-rule-soft">
                <Flame size={20} className="text-slate-soft mx-auto mb-3" />
                <p className="font-serif text-xl mb-1">None yet.</p>
                <p className="text-xs text-slate">Complete a task today to begin.</p>
              </div>
            ) : (
              <ol className="divide-y divide-rule-soft">
                {[...streaks]
                  .filter(s => s.currentStreak > 0)
                  .sort((a, b) => b.currentStreak - a.currentStreak)
                  .slice(0, 5)
                  .map((s, i) => (
                    <li key={s.id} className="grid grid-cols-[24px_1fr_auto] items-baseline gap-3 py-4 first:pt-0">
                      <span className="font-mono text-[10px] text-slate-soft tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      <span className="font-serif text-lg truncate leading-tight">{s.name}</span>
                      <span className="inline-flex items-baseline gap-1 font-mono text-[11px] uppercase tracking-tracked-tight text-brass tabular-nums">
                        {s.currentStreak}<span className="opacity-60">d</span>
                      </span>
                    </li>
                  ))}
              </ol>
            )}

            <div className="mt-6 pt-5 border-t border-rule-soft">
              <Link to="/analytics" className="eyebrow-accent inline-flex items-center gap-1.5 hover:text-accent">
                View analytics <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function SectionHeader({ num, title, italic, trailing, hint, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <p className="eyebrow mb-2">/ {num} Section</p>
        <h3 className="font-serif text-3xl sm:text-4xl leading-tight tracking-tight">
          {title} {italic && <em className="italic text-brass">{italic}</em>} {trailing && <span>{trailing}</span>}
        </h3>
        {hint && <p className="text-sm text-slate mt-2">{hint}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function HeaderStat({ num, label, value, mono }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-mono text-[10px] text-brass uppercase tracking-tracked-tight">{num}.</span>
        <span className="eyebrow">{label}</span>
      </div>
      <p className={cn('font-serif text-2xl leading-none tabular-nums', mono && 'font-mono text-base uppercase tracking-tracked-tight')}>
        {value}
      </p>
    </div>
  );
}

function KpiCell({ num, label, value, unit, hint, bar, italic, span }) {
  return (
    <div className={`${span} bg-paper p-5 sm:p-6 flex flex-col`}>
      <div className="flex items-center justify-between mb-5">
        <span className="eyebrow">/ {num}</span>
        <span className="font-mono text-[10px] text-slate-soft uppercase tracking-tracked-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('font-serif text-[52px] leading-none tracking-tight tabular-nums', italic && 'italic text-brass')}>
          {value}
        </span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {bar !== undefined && (
        <div className="mt-4 h-[2px] w-full bg-paper-3">
          <div
            className="h-full bg-accent transition-all duration-700 ease-out-expo"
            style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
          />
        </div>
      )}
      {hint && <p className="text-xs text-slate mt-3 truncate">{hint}</p>}
    </div>
  );
}

function ProgressRing({ value }) {
  const size = 160;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E3DED0"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E3A5F"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-5xl tabular-nums leading-none">{value}<span className="text-2xl text-slate">%</span></span>
        <span className="eyebrow mt-2">Complete</span>
      </div>
    </div>
  );
}
