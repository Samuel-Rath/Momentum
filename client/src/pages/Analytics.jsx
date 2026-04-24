import { useState, useEffect } from 'react';
import { analyticsApi } from '../lib/api';
import {
  Activity, Flame, TrendingUp, Award, Sparkles, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import PerformanceBoard from '../components/PerformanceBoard';

export default function Analytics() {
  const [streaks, setStreaks] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.streaks(),
      analyticsApi.completion('month'),
      analyticsApi.heatmap(),
      analyticsApi.insights(),
    ])
      .then(([s, c, h, i]) => {
        setStreaks(s.data);
        setCompletion(c.data);
        setHeatmap(h.data);
        setInsights(i.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Activity className="text-accent animate-pulse-soft" size={22} />
        <p className="eyebrow">Loading analytics…</p>
      </div>
    );
  }

  const validDays = completion.filter(d => d.total > 0);
  const overallRate = validDays.length > 0
    ? Math.round(validDays.reduce((sum, d) => sum + d.rate, 0) / validDays.length)
    : 0;

  const maxCurrentStreak = Math.max(0, ...streaks.map(s => s.currentStreak));
  const maxLongestStreak = Math.max(0, ...streaks.map(s => s.longestStreak));
  const activeStreaks = streaks.filter(s => s.currentStreak > 0).length;
  const dormantCount = streaks.filter(s => s.currentStreak === 0).length;

  const sortedByStreak = [...streaks].sort((a, b) => b.currentStreak - a.currentStreak);
  const topPerformers = sortedByStreak.filter(s => s.currentStreak > 0).slice(0, 5);

  const heatCells = [...heatmap].slice(-91);
  while (heatCells.length < 91) heatCells.unshift({ rate: null });

  const chartData = completion.slice(-14).map(d => ({
    date: d.label?.split(',')[0]?.slice(0, 3) || '',
    rate: d.total === 0 ? 0 : d.rate,
    total: d.total,
  }));

  return (
    <div className="px-6 sm:px-10 py-10 max-w-[1280px] mx-auto">

      {/* ── Editorial header ── */}
      <header className="mb-14 sm:mb-20">
        <p className="eyebrow mb-4">/ 03 Analytics — performance report</p>
        <h2 className="display text-[56px] sm:text-[88px] lg:text-[120px] text-ink max-w-4xl">
          Patterns &<br />
          <span className="italic text-brass">progress.</span>
        </h2>
        <p className="text-base text-slate max-w-lg mt-5">
          A quiet read of your consistency. Streaks, trends, and the days you kept your word.
        </p>
      </header>

      {/* ── Summary row ── */}
      <section className="mb-14 sm:mb-20">
        <SectionHeader num="01" title="The" italic="numbers" trailing="at a glance." />

        <div className="grid grid-cols-12 gap-[1px] bg-rule border border-rule">
          <KpiCell
            span="col-span-6 lg:col-span-3"
            num="01"
            label="Avg completion"
            value={overallRate}
            unit="%"
            hint={`${validDays.length} active days`}
          />
          <KpiCell
            span="col-span-6 lg:col-span-3"
            num="02"
            label="Longest streak"
            value={maxLongestStreak}
            unit="days"
            italic
            hint={maxCurrentStreak >= maxLongestStreak && maxLongestStreak > 0 ? 'Personal best' : `Current ${maxCurrentStreak}d`}
          />
          <KpiCell
            span="col-span-6 lg:col-span-3"
            num="03"
            label="Active"
            value={activeStreaks}
            unit=""
            hint={streaks.length ? `of ${streaks.length} tasks` : 'No tasks yet'}
          />
          <KpiCell
            span="col-span-6 lg:col-span-3"
            num="04"
            label="Dormant"
            value={dormantCount}
            unit=""
            hint={dormantCount === 0 ? 'All on track' : 'Need attention'}
          />
        </div>
      </section>

      {/* ── Chart + Top streaks ── */}
      <section className="mb-14 sm:mb-20">
        <SectionHeader
          num="02"
          title="Daily"
          italic="completion,"
          trailing="last fortnight."
        />

        <div className="grid grid-cols-12 gap-[1px] bg-rule border border-rule">
          {/* Bar chart */}
          <div className="col-span-12 lg:col-span-8 bg-paper p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="eyebrow">/ 02A Completion rate</p>
                <p className="font-serif text-lg mt-1">{chartData.length} days</p>
              </div>
              <span className="badge-accent">
                <TrendingUp size={10} />
                {overallRate}% avg
              </span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6CFBE" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#D6CFBE' }}
                    tick={{ fill: '#5E6A77', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    dy={8}
                    interval={Math.max(0, Math.floor(chartData.length / 7) - 1)}
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
                    cursor={{ fill: 'rgba(30, 58, 95, 0.06)' }}
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
                  <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.total === 0 ? '#E3DED0' : d.rate >= 70 ? '#1E3A5F' : '#8A6F3D'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 pt-5 border-t border-rule-soft flex items-center gap-6 flex-wrap">
              <LegendDot color="#1E3A5F" label="Strong day (≥70%)" />
              <LegendDot color="#8A6F3D" label="Below target" />
              <LegendDot color="#E3DED0" label="No data" />
            </div>
          </div>

          {/* Top streaks */}
          <div className="col-span-12 lg:col-span-4 bg-paper p-6 sm:p-8">
            <p className="eyebrow mb-1">/ 02B Top streaks</p>
            <p className="font-serif text-lg mb-6">In motion.</p>

            {topPerformers.length > 0 ? (
              <ol className="divide-y divide-rule-soft">
                {topPerformers.map((s, i) => {
                  const pct = maxLongestStreak > 0
                    ? Math.round((s.currentStreak / maxLongestStreak) * 100)
                    : 100;
                  return (
                    <li key={s.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-2 mb-2">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-slate-soft tabular-nums w-5 shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="font-serif text-base truncate leading-tight">{s.name}</span>
                        </div>
                        <span className="font-mono text-[11px] uppercase tracking-tracked-tight text-brass tabular-nums shrink-0">
                          {s.currentStreak}d
                        </span>
                      </div>
                      <div className="h-[2px] w-full bg-paper-3 ml-7">
                        <div
                          className="h-full bg-brass transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="text-center py-10 border-t border-rule-soft">
                <Flame size={20} className="text-slate-soft mx-auto mb-3" />
                <p className="font-serif text-xl mb-1">No active streaks.</p>
                <p className="text-xs text-slate">Log a task to begin.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Heatmap ── */}
      <section className="mb-14 sm:mb-20">
        <SectionHeader
          num="03"
          title="Ninety"
          italic="days,"
          trailing="in one view."
          hint="Darker squares mean higher completion."
        />

        <div className="bg-paper border border-rule p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <p className="eyebrow">/ 03A Consistency</p>
              <p className="font-serif text-lg mt-1">Daily completion rate</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="eyebrow text-[10px]">Low</span>
              <div className="flex gap-1">
                <div className="w-3.5 h-3.5 bg-paper-3 border border-rule-soft" />
                <div className="w-3.5 h-3.5" style={{ background: 'rgba(30, 58, 95, 0.25)' }} />
                <div className="w-3.5 h-3.5" style={{ background: 'rgba(30, 58, 95, 0.55)' }} />
                <div className="w-3.5 h-3.5 bg-accent" />
              </div>
              <span className="eyebrow text-[10px]">High</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div
              className="grid gap-1.5 min-w-[600px]"
              style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
            >
              {heatCells.map((cell, i) => {
                let bg;
                let border = 'transparent';
                if (cell.rate === null || cell.rate === undefined) {
                  bg = '#ECE8DC';
                  border = '#E3DED0';
                } else if (cell.rate >= 0.8) {
                  bg = '#1E3A5F';
                } else if (cell.rate >= 0.5) {
                  bg = 'rgba(30, 58, 95, 0.55)';
                } else if (cell.rate >= 0.2) {
                  bg = 'rgba(30, 58, 95, 0.25)';
                } else {
                  bg = '#E3DED0';
                }
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-sm"
                    style={{ background: bg, border: `1px solid ${border}` }}
                    title={cell.date ? `${cell.date}: ${Math.round((cell.rate || 0) * 100)}%` : ''}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Insights + Report ── */}
      <section>
        <SectionHeader num="04" title="Reading" italic="between" trailing="the lines." />

        <div className="grid grid-cols-12 gap-[1px] bg-rule border border-rule">
          {/* Insights */}
          <div className="col-span-12 lg:col-span-7 bg-paper p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles size={16} className="text-brass" />
              <p className="eyebrow">/ 04A Insights</p>
            </div>

            {insights.length > 0 ? (
              <ol className="divide-y divide-rule-soft">
                {insights.slice(0, 4).map((insight, i) => (
                  <li key={i} className="grid grid-cols-[36px_1fr] gap-4 py-5 first:pt-0">
                    <span className="font-mono text-[10px] uppercase tracking-tracked-tight text-brass pt-1.5">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <div>
                      <p className="eyebrow mb-1.5">
                        {insight.type === 'positive' ? '/ Positive signal' : insight.type === 'warning' ? '/ Watch out' : '/ Observation'}
                      </p>
                      <p className="font-serif text-xl leading-snug">{insight.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="eyebrow mb-1.5">/ A Observation</p>
                  <p className="font-serif text-xl leading-snug">
                    {maxCurrentStreak > 0
                      ? <>Your longest current streak is <em className="italic text-brass">{maxCurrentStreak} days</em>. Keep it going.</>
                      : <>Complete tasks for <em className="italic text-brass">seven consecutive days</em> to unlock personalised insights.</>}
                  </p>
                </div>
                <div className="pt-5 border-t border-rule-soft">
                  <p className="eyebrow mb-1.5">/ B {overallRate >= 70 ? 'Strong signal' : 'Room to grow'}</p>
                  <p className="font-serif text-xl leading-snug">
                    {overallRate >= 70
                      ? <>You're completing tasks at <em className="italic text-brass">{overallRate}%</em> on tracked days — a strong rhythm.</>
                      : overallRate >= 40
                      ? <>Average completion is <em className="italic text-brass">{overallRate}%</em>. Try narrowing focus to one task.</>
                      : <>Start with <em className="italic text-brass">one small task</em> each day to build momentum.</>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dormant list */}
          <div className="col-span-12 lg:col-span-5 bg-paper p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <p className="eyebrow">/ 04B Dormant tasks</p>
              <span className="badge">{dormantCount}</span>
            </div>

            {streaks.filter(s => s.currentStreak === 0).length === 0 ? (
              <div className="text-center py-10 border-t border-rule-soft">
                <Award size={20} className="text-success mx-auto mb-3" />
                <p className="font-serif text-xl mb-1">All in motion.</p>
                <p className="text-xs text-slate">Every task has an active streak.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate mb-5">
                  Tasks without an active streak. A gentle nudge toward what's slipped.
                </p>
                <ol className="divide-y divide-rule-soft">
                  {streaks.filter(s => s.currentStreak === 0).slice(0, 6).map((s, i) => (
                    <li key={s.id} className="grid grid-cols-[28px_1fr_auto] items-baseline gap-3 py-3">
                      <span className="font-mono text-[10px] text-slate-soft tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-serif text-base leading-tight truncate">{s.name}</span>
                      <span className="eyebrow text-[10px] capitalize">{s.category}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Performance board — professional view ── */}
      <PerformanceBoard />
    </div>
  );
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

function KpiCell({ num, label, value, unit, hint, italic, span }) {
  return (
    <div className={`${span} bg-paper p-5 sm:p-6 flex flex-col`}>
      <div className="flex items-center justify-between mb-5">
        <span className="eyebrow">/ {num}</span>
        <span className="font-mono text-[10px] text-slate-soft uppercase tracking-tracked-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-serif text-[52px] leading-none tracking-tight tabular-nums ${italic ? 'italic text-brass' : ''}`}>
          {value}
        </span>
        {unit && <span className="font-mono text-xs uppercase tracking-tracked-tight text-slate">{unit}</span>}
      </div>
      {hint && <p className="text-xs text-slate mt-3 truncate">{hint}</p>}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
      <span className="eyebrow text-[10px] normal-case">{label}</span>
    </div>
  );
}
