import { useState, useEffect } from 'react';
import { analyticsApi } from '../lib/api';
import { Flame, TrendingUp, Target, Lightbulb } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { cn } from '../lib/utils';

export default function Analytics() {
  const [streaks, setStreaks] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [insights, setInsights] = useState([]);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.streaks(),
      analyticsApi.completion(period),
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

  useEffect(() => {
    analyticsApi.completion(period)
      .then((r) => setCompletion(r.data))
      .catch(console.error);
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-accent text-3xl animate-pulse">🔥</div>
      </div>
    );
  }

  const overallRate =
    completion.length > 0
      ? Math.round(completion.reduce((sum, d) => sum + d.rate, 0) / completion.filter((d) => d.total > 0).length || 0)
      : 0;

  const insightColors = {
    positive: { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    info: { bg: 'bg-violet/10', border: 'border-violet/30', text: 'text-violet' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-muted mt-1">Understand your patterns, eliminate your weaknesses.</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          icon={<Flame size={20} className="text-accent" />}
          label="Best Streak"
          value={`${Math.max(0, ...streaks.map((s) => s.currentStreak))} days`}
        />
        <MetricCard
          icon={<TrendingUp size={20} className="text-success" />}
          label="Longest Ever"
          value={`${Math.max(0, ...streaks.map((s) => s.longestStreak))} days`}
        />
        <MetricCard
          icon={<Target size={20} className="text-violet" />}
          label={`${period === 'week' ? '7-day' : '30-day'} Rate`}
          value={`${isNaN(overallRate) ? 0 : overallRate}%`}
        />
        <MetricCard
          icon={<Lightbulb size={20} className="text-amber-400" />}
          label="Insights"
          value={`${insights.length} found`}
        />
      </div>

      {/* Streaks per habit */}
      {streaks.length > 0 && (
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flame size={18} className="text-accent" /> Streak Overview
          </h2>
          <div className="space-y-3">
            {streaks.map((s) => (
              <div key={s.id} className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ background: `${s.color || '#F97316'}20` }}
                >
                  {s.icon || '⚡'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-muted ml-2 shrink-0">
                      best: <span className="text-white font-semibold">{s.longestStreak}</span>
                    </p>
                  </div>
                  <div className="h-2 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: s.longestStreak > 0 ? `${(s.currentStreak / s.longestStreak) * 100}%` : '0%',
                        background: s.color || '#F97316',
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-accent text-sm font-bold">{s.currentStreak}</span>
                  <span className="text-base">🔥</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completion chart */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-white">Completion Rate</h2>
          <div className="flex gap-2">
            {['week', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  period === p
                    ? 'bg-accent text-white'
                    : 'bg-elevated text-muted hover:text-white border border-border'
                )}
              >
                {p === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completion} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={period === 'month' ? 4 : 0}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: '#1A1A27',
                  border: '1px solid #1E1E2E',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '13px',
                }}
                formatter={(val) => [`${val}%`, 'Completion']}
                cursor={{ fill: '#1E1E2E' }}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {completion.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.rate >= 70 ? '#22C55E' : entry.rate >= 40 ? '#F97316' : '#EF4444'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Heatmap */}
      {heatmap.length > 0 && (
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">90-Day Heatmap</h2>
          <div className="flex flex-wrap gap-1">
            {heatmap.map((d, i) => (
              <div
                key={i}
                title={`${d.date}: ${d.rate !== null ? Math.round(d.rate * 100) + '%' : 'No data'}`}
                className="w-3 h-3 rounded-sm transition-colors"
                style={{
                  background:
                    d.rate === null
                      ? '#1E1E2E'
                      : d.rate >= 0.8
                      ? '#22C55E'
                      : d.rate >= 0.5
                      ? '#F97316'
                      : d.rate > 0
                      ? '#EF444488'
                      : '#1E1E2E',
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>Less</span>
            {['#1E1E2E', '#EF444488', '#F97316', '#22C55E'].map((c) => (
              <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
            <span>More</span>
          </div>
        </section>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-400" />
            Insights
          </h2>
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const style = insightColors[insight.type] || insightColors.info;
              return (
                <div
                  key={i}
                  className={cn('rounded-xl border px-5 py-4 flex items-start gap-3', style.bg, style.border)}
                >
                  <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
                  <p className="text-sm text-slate-200 leading-relaxed">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {insights.length === 0 && completion.length > 0 && (
        <div className="card text-center py-10">
          <p className="text-2xl mb-2">🤖</p>
          <p className="text-white font-semibold">Not enough data yet</p>
          <p className="text-muted text-sm mt-1">Keep logging for 7+ days and insights will appear here.</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-muted text-xs font-medium">{label}</span></div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
