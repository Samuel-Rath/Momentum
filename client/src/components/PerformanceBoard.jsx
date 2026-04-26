import { useState, useEffect, useMemo } from 'react';
import { analyticsApi } from '../lib/api';
import {
  ArrowUpRight, ArrowDownRight, Minus, ArrowUpDown,
  TrendingUp, AlertCircle,
} from 'lucide-react';
import {
  Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, Area, AreaChart,
} from 'recharts';

// Stagger child sections on mount so the board reads as "compiling".
const ANIM = (delay) => ({
  animationDelay: `${delay}ms`,
  animationFillMode: 'both',
});

const PERIODS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

const SORT_COLUMNS = [
  { key: 'score', label: 'Score' },
  { key: 'rate', label: 'Rate' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'trend', label: 'Trend' },
  { key: 'lastActive', label: 'Last active' },
];

export default function PerformanceBoard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    setLoading(true);
    analyticsApi.performance(days)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  const sortedHabits = useMemo(() => {
    if (!data?.habits) return [];
    const copy = [...data.habits];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (sortKey === 'lastActive') {
        // lastActive may be null (no activity) — push to the bottom
        const aa = a.lastActive === null ? Infinity : a.lastActive;
        const bb = b.lastActive === null ? Infinity : b.lastActive;
        return sortDir === 'asc' ? aa - bb : bb - aa;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (loading && !data) return <BoardSkeleton />;

  if (!data) return null;

  const { summary, dayOfWeek, bestDow, worstDow, categories, weeks, atRisk } = data;
  const avgPct = Math.round(summary.avgRate * 100);
  const deltaPct = summary.delta !== null ? Math.round(summary.delta * 100) : null;
  const prevPct = summary.prevRate !== null ? Math.round(summary.prevRate * 100) : null;

  return (
    <section className="mb-14 sm:mb-20">
      <SectionHeader
        num="05"
        title="Performance"
        italic="board"
        trailing="— professional view."
        hint="A working read of your rhythm. Switch the window to zoom in or out."
        action={
          <div className="flex border border-rule bg-paper-2 divide-x divide-rule-soft">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={`px-3.5 h-9 font-mono text-[11px] uppercase tracking-tracked-tight transition-colors duration-150 ${
                  days === p.days
                    ? 'bg-accent text-accent-fg'
                    : 'text-slate hover:text-ink hover:bg-paper-3'
                }`}
                aria-pressed={days === p.days}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Top-line KPIs ── */}
      <div
        className="grid grid-cols-12 gap-[1px] bg-rule border border-rule mb-[1px] animate-slide-up"
        style={ANIM(40)}
      >
        <BoardKpi
          span="col-span-6 lg:col-span-3"
          num="A"
          label="Avg completion"
          value={avgPct}
          unit="%"
          delta={deltaPct}
          prev={prevPct !== null ? `Prev ${prevPct}%` : 'No prior window'}
        />
        <BoardKpi
          span="col-span-6 lg:col-span-3"
          num="B"
          label="Perfect days"
          value={summary.perfectDays}
          unit="days"
          hint={summary.trackedDays > 0
            ? `${Math.round((summary.perfectDays / summary.trackedDays) * 100)}% of tracked`
            : 'No tracked days'}
        />
        <BoardKpi
          span="col-span-6 lg:col-span-3"
          num="C"
          label="Best weekday"
          value={bestDow ? bestDow.day : '—'}
          bigString
          hint={bestDow
            ? `${Math.round(bestDow.rate * 100)}% over ${bestDow.total} logs`
            : 'Need more data'}
        />
        <BoardKpi
          span="col-span-6 lg:col-span-3"
          num="D"
          label="Watch for"
          value={worstDow ? worstDow.day : '—'}
          bigString
          italic
          hint={worstDow
            ? `${Math.round(worstDow.rate * 100)}% — the day to protect`
            : 'Need more data'}
        />
      </div>

      {/* ── Day of week matrix + Category leaderboard ── */}
      <div
        className="grid grid-cols-12 gap-[1px] bg-rule border border-rule border-t-0 mb-[1px] animate-slide-up"
        style={ANIM(120)}
      >
        <div className="col-span-12 lg:col-span-7 bg-paper p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="eyebrow">/ 05A Day of week</p>
              <p className="font-serif text-lg mt-1">Your rhythm across the week.</p>
            </div>
            <span className="badge">n={summary.totalLogs}</span>
          </div>

          <DayOfWeekMatrix rows={dayOfWeek} bestIdx={bestDow?.idx} worstIdx={worstDow?.idx} />
        </div>

        <div className="col-span-12 lg:col-span-5 bg-paper p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="eyebrow">/ 05B Categories</p>
              <p className="font-serif text-lg mt-1">Where you deliver.</p>
            </div>
            <span className="badge">{categories.length}</span>
          </div>

          <CategoryLeaderboard categories={categories} />
        </div>
      </div>

      {/* ── Rolling trend ── */}
      <div
        className="bg-paper border border-rule border-t-0 p-6 sm:p-8 mb-[1px] animate-slide-up"
        style={ANIM(200)}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="eyebrow">/ 05C Eight-week trend</p>
            <p className="font-serif text-lg mt-1">Rolling cadence, four-week smoothed.</p>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            <LegendLine color="#1E3A5F" label="Weekly rate" dashed={false} />
            <LegendLine color="#8A6F3D" label="4-wk moving avg" dashed />
          </div>
        </div>
        <TrendChart weeks={weeks} />
      </div>

      {/* ── Per-habit scoring (table desktop, cards mobile) ── */}
      <div
        className="bg-paper border border-rule border-t-0 p-6 sm:p-8 mb-[1px] animate-slide-up"
        style={ANIM(280)}
      >
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="eyebrow">/ 05D Habit scoring</p>
            <p className="font-serif text-lg mt-1">Each habit, ranked.</p>
            <p className="text-xs text-slate mt-1.5 max-w-md">
              Rates are scored against each habit's cadence — daily habits per day, weekly per week.
            </p>
          </div>
          <span className="eyebrow text-[10px] hidden sm:inline-flex items-center gap-1.5">
            <ArrowUpDown size={11} /> Click a column
          </span>
        </div>

        {/* Mobile: cards */}
        <div className="sm:hidden">
          <HabitCards habits={sortedHabits} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
        </div>
        {/* Desktop: table */}
        <div className="hidden sm:block">
          <HabitTable
            habits={sortedHabits}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* ── At-risk watchlist ── */}
      <div
        className="bg-paper border border-rule border-t-0 p-6 sm:p-8 animate-slide-up"
        style={ANIM(360)}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-warning" />
            <div>
              <p className="eyebrow">/ 05E Watchlist</p>
              <p className="font-serif text-lg mt-1">Slipping — catch them early.</p>
            </div>
          </div>
          <span className="badge-warning">{atRisk.length}</span>
        </div>

        {atRisk.length === 0 ? (
          <div className="text-center py-10 border-t border-rule-soft">
            <TrendingUp size={20} className="text-success mx-auto mb-3" />
            <p className="font-serif text-xl mb-1">Nothing at risk.</p>
            <p className="text-xs text-slate">Every habit is holding or improving.</p>
          </div>
        ) : (
          <ol className="divide-y divide-rule-soft">
            {atRisk.map((h, i) => (
              <li key={h.id} className="grid grid-cols-[28px_1fr_auto_auto] items-baseline gap-4 py-3.5">
                <span className="font-mono text-[10px] text-slate-soft tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="font-serif text-base leading-tight truncate">{h.name}</p>
                  <p className="eyebrow text-[10px] mt-1 capitalize">{h.category || '—'}</p>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-slate">
                  {Math.round(h.rate * 100)}%
                </span>
                <TrendTag trend={h.trend} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

// ── Day of week matrix ──
function DayOfWeekMatrix({ rows, bestIdx, worstIdx }) {
  const maxRate = Math.max(0.01, ...rows.map((r) => r.rate));
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = Math.round(r.rate * 100);
        const width = (r.rate / maxRate) * 100;
        const isBest = r.idx === bestIdx && r.total > 0;
        const isWorst = r.idx === worstIdx && r.total > 0;
        return (
          <div key={r.day} className="grid grid-cols-[44px_1fr_60px] items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-tracked-tight text-slate">
              {r.day}
            </span>
            <div className="h-4 bg-paper-3 relative overflow-hidden">
              {r.total === 0 ? (
                <div className="absolute inset-0 flex items-center justify-start pl-2">
                  <span className="font-mono text-[9px] uppercase tracking-tracked-tight text-slate-soft">
                    no data
                  </span>
                </div>
              ) : (
                <div
                  className="h-full transition-all duration-500 ease-out-expo"
                  style={{
                    width: `${width}%`,
                    background: isBest ? '#1E3A5F' : isWorst ? '#8A6F3D' : 'rgba(30, 58, 95, 0.45)',
                  }}
                />
              )}
            </div>
            <span className="font-mono text-[11px] tabular-nums text-ink text-right">
              {r.total > 0 ? `${pct}%` : '—'}
              <span className="text-slate-soft ml-1 text-[10px]">
                {r.total > 0 ? `· ${r.total}` : ''}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Category leaderboard ──
function CategoryLeaderboard({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-10 border-t border-rule-soft">
        <p className="font-serif text-xl mb-1">No categories yet.</p>
        <p className="text-xs text-slate">Add habits to see category performance.</p>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-rule-soft">
      {categories.map((c, i) => {
        const pct = Math.round(c.rate * 100);
        return (
          <li key={c.category} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <div className="flex items-baseline gap-2.5 min-w-0">
                <span className="font-mono text-[10px] text-slate-soft tabular-nums w-5 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-serif text-base capitalize truncate leading-tight">
                  {c.category}
                </span>
                <span className="eyebrow text-[9px] text-slate-soft shrink-0">
                  · {c.habits}
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-ink shrink-0">
                {c.total > 0 ? `${pct}%` : '—'}
              </span>
            </div>
            <div className="h-[2px] w-full bg-paper-3 ml-7">
              <div
                className="h-full transition-all duration-500 ease-out-expo"
                style={{
                  width: c.total > 0 ? `${pct}%` : '0%',
                  background: pct >= 70 ? '#1E3A5F' : pct >= 40 ? '#8A6F3D' : '#B8B09B',
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ── Rolling trend chart ──
function TrendChart({ weeks }) {
  const chartData = weeks.map((w) => ({
    label: w.label,
    rate: Math.round(w.rate * 100),
    ma: Math.round(w.ma * 100),
    hasData: w.total > 0,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E3A5F" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D6CFBE" vertical={false} />
          <XAxis
            dataKey="label"
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
            tickFormatter={(v) => `${v}`}
            width={32}
          />
          <ReferenceLine y={70} stroke="#8A6F3D" strokeDasharray="2 4" opacity={0.5} />
          <Tooltip
            cursor={{ stroke: '#1E3A5F', strokeOpacity: 0.18, strokeWidth: 1 }}
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
            formatter={(value, name) => [
              `${value}%`,
              name === 'rate' ? 'Rate' : 'MA',
            ]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#1E3A5F"
            strokeWidth={2}
            fill="url(#rateFill)"
            dot={{ r: 3, fill: '#1E3A5F', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#1E3A5F' }}
            isAnimationActive
          />
          <Line
            type="monotone"
            dataKey="ma"
            stroke="#8A6F3D"
            strokeWidth={1.75}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Habit scoring table ──
function HabitTable({ habits, sortKey, sortDir, onSort }) {
  if (!habits || habits.length === 0) {
    return (
      <div className="text-center py-10 border-t border-rule-soft">
        <p className="font-serif text-xl mb-1">No habits to rank.</p>
        <p className="text-xs text-slate">Add habits to populate the board.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-rule">
            <th className="text-left py-2.5 pr-4 font-mono text-[10px] uppercase tracking-tracked-tight text-slate-soft w-8">
              #
            </th>
            <th className="text-left py-2.5 pr-4 font-mono text-[10px] uppercase tracking-tracked-tight text-slate">
              Habit
            </th>
            {SORT_COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className={`text-right py-2.5 pl-4 font-mono text-[10px] uppercase tracking-tracked-tight cursor-pointer select-none transition-colors hover:text-ink ${
                  sortKey === col.key ? 'text-ink' : 'text-slate'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  {sortKey === col.key && (
                    <span className="text-brass">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule-soft">
          {habits.map((h, i) => {
            const scorePct = Math.round(h.score * 100);
            return (
              <tr key={h.id} className="hover:bg-paper-2/60 transition-colors">
                <td className="py-3 pr-4 font-mono text-[10px] text-slate-soft tabular-nums align-middle">
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td className="py-3 pr-4 align-middle">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-serif text-[15px] leading-tight truncate">
                        {h.name}
                      </span>
                      <FrequencyChip frequency={h.frequency} />
                      {h.category && (
                        <span className="eyebrow text-[9px] capitalize shrink-0">
                          {h.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5">
                      <Sparkline series={h.series} trend={h.trend} />
                    </div>
                  </div>
                </td>
                <td className="py-3 pl-4 text-right align-middle">
                  <ScoreCell pct={scorePct} />
                </td>
                <td className="py-3 pl-4 text-right align-middle">
                  <span className="font-mono text-[12px] tabular-nums text-ink">
                    {h.total > 0 ? `${Math.round(h.rate * 100)}%` : '—'}
                  </span>
                </td>
                <td className="py-3 pl-4 text-right align-middle">
                  <span className="font-mono text-[12px] tabular-nums text-ink">
                    {h.total > 0 ? `${Math.round(h.consistency * 100)}%` : '—'}
                  </span>
                </td>
                <td className="py-3 pl-4 text-right align-middle">
                  <TrendTag trend={h.trend} small />
                </td>
                <td className="py-3 pl-4 text-right align-middle">
                  <span className="font-mono text-[11px] tabular-nums text-slate">
                    {h.lastActive === null
                      ? '—'
                      : h.lastActive === 0
                      ? 'Today'
                      : `${h.lastActive}d ago`}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScoreCell({ pct }) {
  const color = pct >= 70 ? '#1E3A5F' : pct >= 45 ? '#8A6F3D' : '#B8B09B';
  return (
    <div className="inline-flex items-center gap-2 justify-end">
      <div className="w-16 h-1.5 bg-paper-3 overflow-hidden hidden sm:block">
        <div
          className="h-full transition-all duration-500 ease-out-expo"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="font-mono text-[12px] tabular-nums text-ink w-8 text-right">
        {pct}
      </span>
    </div>
  );
}

function TrendTag({ trend, small }) {
  if (trend === null || trend === undefined || trend === 0) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono tabular-nums text-slate-soft ${small ? 'text-[11px]' : 'text-[12px]'}`}>
        <Minus size={small ? 11 : 12} />
        flat
      </span>
    );
  }
  const up = trend > 0;
  const pct = Math.round(Math.abs(trend) * 100);
  const color = up ? 'text-success' : 'text-danger';
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 font-mono tabular-nums ${color} ${small ? 'text-[11px]' : 'text-[12px]'}`}>
      <Icon size={small ? 11 : 12} />
      {pct}%
    </span>
  );
}

// ── Supporting pieces ──
function SectionHeader({ num, title, italic, trailing, hint, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <p className="eyebrow mb-2">/ {num} Section</p>
        <h3 className="font-serif text-3xl sm:text-4xl leading-tight tracking-tight">
          {title} {italic && <em className="italic text-brass">{italic}</em>} {trailing && <span>{trailing}</span>}
        </h3>
        {hint && <p className="text-sm text-slate mt-2 max-w-lg">{hint}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function BoardKpi({ num, label, value, unit, hint, delta, prev, italic, bigString, span }) {
  return (
    <div className={`${span} bg-paper p-5 sm:p-6 flex flex-col`}>
      <div className="flex items-center justify-between mb-5">
        <span className="eyebrow">/ {num}</span>
        <span className="font-mono text-[10px] text-slate-soft uppercase tracking-tracked-tight truncate ml-2">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className={`font-serif leading-none tracking-tight tabular-nums ${
            italic ? 'italic text-brass' : ''
          } ${bigString ? 'text-[38px]' : 'text-[52px]'}`}
        >
          {value}
        </span>
        {unit && !bigString && (
          <span className="font-mono text-xs uppercase tracking-tracked-tight text-slate">
            {unit}
          </span>
        )}
      </div>
      <div className="mt-3 min-h-[18px] flex items-center gap-2 flex-wrap">
        {delta !== null && delta !== undefined ? (
          <DeltaTag delta={delta} />
        ) : null}
        {(hint || prev) && (
          <p className="text-xs text-slate truncate">{hint || prev}</p>
        )}
      </div>
    </div>
  );
}

function DeltaTag({ delta }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-tracked-tight text-slate-soft">
        <Minus size={10} /> flat
      </span>
    );
  }
  const up = delta > 0;
  const cls = up
    ? 'text-success border-success/30 bg-success-soft'
    : 'text-danger border-danger/30 bg-danger/10';
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-tracked-tight border rounded-sm tabular-nums ${cls}`}>
      <Icon size={10} />
      {up ? '+' : ''}{delta}%
    </span>
  );
}

// Cadence indicator next to a habit name. Empty for daily/unknown so we
// only call out the cadence when it's notable (weekly), keeping daily
// habits visually quiet — they're the default.
function FrequencyChip({ frequency }) {
  if (!frequency || frequency === 'daily') return null;
  const label = frequency === 'weekly' ? 'Weekly' : 'Custom';
  return (
    <span
      className="inline-flex items-center px-1.5 h-[16px] font-mono text-[9px] uppercase tracking-tracked-tight text-brass border border-brass/30 bg-brass-soft rounded-sm shrink-0"
      title={`${label} cadence — scored once per ${frequency === 'weekly' ? 'week' : 'period'}`}
    >
      {label}
    </span>
  );
}

function LegendLine({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="22" height="6" aria-hidden>
        <line
          x1="0" y1="3" x2="22" y2="3"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? '4 3' : '0'}
        />
      </svg>
      <span className="eyebrow text-[10px] normal-case">{label}</span>
    </div>
  );
}

// ── Inline sparkline ──
// Renders a small SVG path from a 0..1 series. Nulls create gaps in the line.
function Sparkline({ series, trend = 0, width = 96, height = 18 }) {
  if (!series || series.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="bg-paper-3"
        aria-hidden
      />
    );
  }

  const padY = 2;
  const usable = height - padY * 2;
  const lastIdx = series.length - 1;

  const points = series.map((v, i) => ({
    x: lastIdx === 0 ? width / 2 : (i / lastIdx) * width,
    y: v === null ? null : height - padY - v * usable,
  }));

  let d = '';
  let inSeg = false;
  for (const p of points) {
    if (p.y === null) {
      inSeg = false;
    } else if (!inSeg) {
      d += `M${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      inSeg = true;
    } else {
      d += ` L${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }
  }

  const last = [...points].reverse().find((p) => p.y !== null);
  const color = trend >= 0 ? '#1E3A5F' : '#8A6F3D';

  return (
    <svg width={width} height={height} className="block overflow-visible" aria-hidden>
      <line
        x1={0} x2={width}
        y1={height - padY - 0.7 * usable}
        y2={height - padY - 0.7 * usable}
        stroke="#D6CFBE" strokeDasharray="2 3" strokeWidth="0.75"
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <circle cx={last.x} cy={last.y} r="1.6" fill={color} />
      )}
    </svg>
  );
}

// ── Habit cards (mobile) ──
function HabitCards({ habits, sortKey, sortDir, onSort }) {
  if (!habits || habits.length === 0) {
    return (
      <div className="text-center py-10 border-t border-rule-soft">
        <p className="font-serif text-xl mb-1">No habits to rank.</p>
        <p className="text-xs text-slate">Add habits to populate the board.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort chips — horizontally scrollable on narrow phones */}
      <div className="-mx-6 px-6 mb-4 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {SORT_COLUMNS.map((col) => {
            const active = sortKey === col.key;
            return (
              <button
                key={col.key}
                onClick={() => onSort(col.key)}
                className={`shrink-0 px-2.5 h-7 font-mono text-[10px] uppercase tracking-tracked-tight border rounded-sm transition-colors ${
                  active
                    ? 'bg-accent text-accent-fg border-accent'
                    : 'bg-paper-2 text-slate border-rule hover:text-ink hover:border-rule-strong'
                }`}
                aria-pressed={active}
              >
                {col.label}
                {active && <span className="ml-1.5">{sortDir === 'asc' ? '↑' : '↓'}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <ol className="divide-y divide-rule-soft border-t border-rule-soft">
        {habits.map((h, i) => {
          const scorePct = Math.round(h.score * 100);
          return (
            <li key={h.id} className="py-4">
              <div className="flex items-baseline justify-between gap-3 mb-2.5">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-slate-soft tabular-nums w-6 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-serif text-base leading-tight truncate">{h.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <FrequencyChip frequency={h.frequency} />
                  {h.category && (
                    <span className="eyebrow text-[9px] capitalize">{h.category}</span>
                  )}
                </div>
              </div>

              <div className="ml-8 mb-3">
                <div className="flex items-center gap-3">
                  <ScoreCell pct={scorePct} />
                  <Sparkline series={h.series} trend={h.trend} width={80} height={16} />
                </div>
              </div>

              <dl className="ml-8 grid grid-cols-2 gap-x-4 gap-y-1.5">
                <CardStat label="Rate" value={h.total > 0 ? `${Math.round(h.rate * 100)}%` : '—'} />
                <CardStat label="Consistency" value={h.total > 0 ? `${Math.round(h.consistency * 100)}%` : '—'} />
                <CardStat label="Trend" value={<TrendTag trend={h.trend} small />} />
                <CardStat
                  label="Last active"
                  value={
                    h.lastActive === null
                      ? '—'
                      : h.lastActive === 0
                      ? 'Today'
                      : `${h.lastActive}d ago`
                  }
                />
              </dl>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CardStat({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-rule-soft/50 pb-1.5 last-of-type:border-b-0">
      <dt className="font-mono text-[9px] uppercase tracking-tracked-tight text-slate-soft">
        {label}
      </dt>
      <dd className="font-mono text-[12px] tabular-nums text-ink">{value}</dd>
    </div>
  );
}

// ── Editorial skeleton ──
// Matches the live layout so the page reserves space and reads as
// "compiling a report" rather than a generic spinner.
function BoardSkeleton() {
  return (
    <section className="mb-14 sm:mb-20 animate-fade-in">
      <SectionHeader
        num="05"
        title="Performance"
        italic="board"
        trailing="— professional view."
        hint="Compiling report…"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-12 gap-[1px] bg-rule border border-rule mb-[1px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="col-span-6 lg:col-span-3 bg-paper p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <SkelBar w="22px" h="10px" />
              <SkelBar w="80px" h="10px" />
            </div>
            <SkelBar w="60%" h="40px" />
            <div className="mt-3"><SkelBar w="45%" h="11px" /></div>
          </div>
        ))}
      </div>

      {/* Day of week + categories row */}
      <div className="grid grid-cols-12 gap-[1px] bg-rule border border-rule border-t-0 mb-[1px]">
        <div className="col-span-12 lg:col-span-7 bg-paper p-6 sm:p-8 space-y-3">
          <SkelBar w="40%" h="12px" />
          <SkelBar w="55%" h="20px" />
          <div className="space-y-2.5 pt-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="grid grid-cols-[44px_1fr_60px] items-center gap-3">
                <SkelBar w="28px" h="10px" />
                <SkelBar w={`${40 + (i * 7) % 50}%`} h="14px" />
                <SkelBar w="40px" h="11px" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 bg-paper p-6 sm:p-8 space-y-3">
          <SkelBar w="50%" h="12px" />
          <SkelBar w="60%" h="20px" />
          <div className="space-y-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <SkelBar w="50%" h="14px" />
                  <SkelBar w="32px" h="11px" />
                </div>
                <SkelBar w="100%" h="2px" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-paper border border-rule border-t-0 p-6 sm:p-8 mb-[1px]">
        <div className="flex justify-between mb-6">
          <div className="space-y-2">
            <SkelBar w="160px" h="11px" />
            <SkelBar w="220px" h="20px" />
          </div>
          <SkelBar w="120px" h="11px" />
        </div>
        <div className="h-72 relative overflow-hidden bg-paper-2">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-rule/40 to-transparent" />
        </div>
      </div>

      {/* Habit table skeleton */}
      <div className="bg-paper border border-rule border-t-0 p-6 sm:p-8">
        <div className="flex justify-between mb-6">
          <div className="space-y-2">
            <SkelBar w="120px" h="11px" />
            <SkelBar w="180px" h="20px" />
          </div>
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-[28px_1fr_80px_60px] items-center gap-4 py-2">
              <SkelBar w="20px" h="11px" />
              <SkelBar w={`${50 + (i * 11) % 30}%`} h="15px" />
              <SkelBar w="60px" h="11px" />
              <SkelBar w="40px" h="11px" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkelBar({ w, h }) {
  return (
    <div
      className="bg-paper-3 animate-pulse-soft rounded-sm"
      style={{ width: w, height: h }}
    />
  );
}
