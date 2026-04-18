import { useState, useEffect } from 'react';
import { analyticsApi } from '../lib/api';

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
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>insights</span>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest">Processing data…</p>
      </div>
    );
  }

  const validDays = completion.filter(d => d.total > 0);
  const overallRate = validDays.length > 0
    ? Math.round(validDays.reduce((sum, d) => sum + d.rate, 0) / validDays.length)
    : 0;

  const maxCurrentStreak = Math.max(0, ...streaks.map(s => s.currentStreak));
  const maxLongestStreak = Math.max(0, ...streaks.map(s => s.longestStreak));

  const sortedByStreak = [...streaks].sort((a, b) => b.currentStreak - a.currentStreak);
  const topPerformers = sortedByStreak.filter(s => s.currentStreak > 0).slice(0, 3);

  // Pad heatmap to 91 cells for 13-col grid
  const heatCells = [...heatmap].slice(-91);
  while (heatCells.length < 91) heatCells.unshift({ rate: null });

  const completionBars = completion.slice(-7);

  return (
    <div className="pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">

      {/* Header */}
      <section className="mb-8 sm:mb-12">
        <h2 className="text-on-surface-variant font-label text-[0.6875rem] uppercase tracking-[0.2em] mb-2 opacity-60">Performance Deep-Dive</h2>
        <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tighter uppercase">
          Analytics &amp; <span className="text-primary">Insights</span>
        </h1>
      </section>

      {/* Main bento grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">

        {/* Heatmap — col 8 */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low p-6 sm:p-8 border-l-2 border-primary/20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-3">
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight uppercase">90-Day Consistency Heatmap</h3>
              <p className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/60">Execution Density Matrix</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[0.625rem] font-bold uppercase tracking-widest opacity-40">Low</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-surface-container-highest" />
                <div className="w-3 h-3 bg-primary/20" />
                <div className="w-3 h-3 bg-primary/50" />
                <div className="w-3 h-3 bg-primary" />
              </div>
              <span className="text-[0.625rem] font-bold uppercase tracking-widest opacity-40">High</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="grid gap-1.5 min-w-[260px]" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
              {heatCells.map((cell, i) => {
                let opacity = 1;
                let isBg = false;
                if (cell.rate === null || cell.rate === undefined) { isBg = true; }
                else if (cell.rate >= 0.8) { opacity = 1; }
                else if (cell.rate >= 0.5) { opacity = 0.5; }
                else if (cell.rate >= 0.2) { opacity = 0.2; }
                else { isBg = true; }
                return (
                  <div
                    key={i}
                    className={`aspect-square ${isBg ? 'bg-surface-container-highest' : 'bg-primary'}`}
                    style={!isBg ? { opacity } : {}}
                  />
                );
              })}
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-outline-variant/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex gap-8 sm:gap-12">
              <div>
                <p className="font-label text-[0.625rem] uppercase tracking-widest text-on-surface-variant/50 mb-1">Mean Frequency</p>
                <p className="text-xl font-black tracking-tighter">{overallRate}%</p>
              </div>
              <div>
                <p className="font-label text-[0.625rem] uppercase tracking-widest text-on-surface-variant/50 mb-1">Best Streak</p>
                <p className="text-xl font-black tracking-tighter">{maxCurrentStreak} days</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 text-tertiary font-bold text-[0.6875rem] uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              {maxLongestStreak > 0 ? `PEAK: ${maxLongestStreak} DAYS` : 'BUILDING'}
            </span>
          </div>
        </div>

        {/* Stats column — col 4 */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 sm:gap-6">
          <div className="bg-surface-container-low p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <span className="material-symbols-outlined" style={{ fontSize: '8rem' }}>bolt</span>
            </div>
            <div>
              <p className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/60 mb-2">Current Velocity</p>
              <h4 className="text-5xl sm:text-6xl font-black tracking-tighter text-on-surface">
                {maxCurrentStreak} <span className="text-xl text-on-surface-variant">DAYS</span>
              </h4>
            </div>
            <div className="mt-6 sm:mt-8">
              <p className="font-label text-[0.6875rem] uppercase tracking-widest text-primary font-bold">
                {maxCurrentStreak >= maxLongestStreak && maxLongestStreak > 0 ? 'New Personal Record' : 'Active Streak'}
              </p>
              <div className="w-full h-1 bg-surface-container-highest mt-2">
                <div
                  className="h-full bg-primary shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  style={{ width: maxLongestStreak > 0 ? `${Math.round((maxCurrentStreak / maxLongestStreak) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low p-5 sm:p-6">
            <p className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/60 mb-4">Daily Completion Rate</p>
            <div className="flex items-end gap-1 h-20 sm:h-24 mb-4">
              {completionBars.length > 0 ? completionBars.map((d, i) => (
                <div
                  key={i}
                  className={`flex-1 ${d.rate >= 70 ? 'bg-primary' : 'bg-primary/40'}`}
                  style={{ height: `${Math.max(4, d.rate)}%` }}
                />
              )) : (
                <>
                  <div className="flex-1 bg-surface-container-highest" style={{ height: '40%' }} />
                  <div className="flex-1 bg-surface-container-highest" style={{ height: '60%' }} />
                  <div className="flex-1 bg-primary/60" style={{ height: '85%' }} />
                  <div className="flex-1 bg-primary" style={{ height: '95%' }} />
                  <div className="flex-1 bg-primary/40" style={{ height: '70%' }} />
                  <div className="flex-1 bg-surface-container-highest" style={{ height: '50%' }} />
                  <div className="flex-1 bg-primary" style={{ height: '100%' }} />
                </>
              )}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-black tracking-tighter">{overallRate}%</p>
              <p className="font-label text-[0.625rem] uppercase tracking-widest opacity-40">{validDays.length} DAYS</p>
            </div>
          </div>
        </div>

        {/* Precision Insights — col 5 */}
        <div className="col-span-12 lg:col-span-5 bg-[#1b1b20] p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="font-bold text-base sm:text-lg uppercase tracking-tight">Precision Insights</h3>
            </div>
            {insights.length > 0 ? (
              <div className="space-y-6">
                {insights.slice(0, 3).map((insight, i) => (
                  <div key={i}>
                    <p className="font-label text-[0.625rem] uppercase tracking-widest text-secondary/60 mb-1">
                      {insight.type === 'positive' ? 'Optimisation Detected' : insight.type === 'warning' ? 'Momentum Inhibitor' : 'System Insight'}
                    </p>
                    <p className="text-base sm:text-lg font-medium leading-tight">{insight.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="font-label text-[0.625rem] uppercase tracking-widest text-secondary/60 mb-1">Peak Performance Window</p>
                  <p className="text-base sm:text-lg font-medium leading-tight">Execute protocols consistently for 7+ days to generate precision insights.</p>
                </div>
                <div>
                  <p className="font-label text-[0.625rem] uppercase tracking-widest text-secondary/60 mb-1">System Status</p>
                  <p className="text-base sm:text-lg font-medium leading-tight">
                    {maxCurrentStreak > 0
                      ? <><span className="text-secondary font-bold">{maxCurrentStreak}-day streak</span> detected. Maintain velocity.</>
                      : 'Initialise protocols to begin performance tracking.'}
                  </p>
                </div>
                <div>
                  <p className="font-label text-[0.625rem] uppercase tracking-widest text-secondary/60 mb-1">Consistency Alert</p>
                  <p className="text-base sm:text-lg font-medium leading-tight">
                    {overallRate >= 70
                      ? <><span className="text-secondary font-bold">{overallRate}% completion rate</span> — high-performance zone.</>
                      : 'Track daily completions to identify peak performance windows.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Executive Summary — col 7 */}
        <div className="col-span-12 lg:col-span-7 bg-surface-container-low p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight uppercase">Executive Summary</h3>
              <p className="font-label text-[0.6875rem] uppercase tracking-widest text-on-surface-variant/60">Performance Report Analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h4 className="font-label text-[0.625rem] uppercase tracking-[0.15em] text-on-surface-variant/40 mb-4 border-b border-outline-variant/10 pb-2">
                Top Active Streaks
              </h4>
              <ul className="space-y-4">
                {topPerformers.length > 0 ? topPerformers.map(s => (
                  <li key={s.id} className="flex justify-between items-center gap-3">
                    <span className="text-sm font-medium truncate">{s.name}</span>
                    <span className="text-tertiary font-bold tracking-tighter shrink-0">{s.currentStreak}d</span>
                  </li>
                )) : (
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-surface-container-highest" />
                    <span className="text-sm font-medium opacity-60">No active streaks yet</span>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-label text-[0.625rem] uppercase tracking-[0.15em] text-on-surface-variant/40 mb-4 border-b border-outline-variant/10 pb-2">
                Dormant Habits
              </h4>
              <ul className="space-y-4">
                {streaks.filter(s => s.currentStreak === 0).slice(0, 3).map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 ${i === 0 ? 'bg-error' : i === 1 ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                    <span className="text-sm font-medium truncate">{s.name}</span>
                  </li>
                ))}
                {streaks.filter(s => s.currentStreak === 0).length === 0 && (
                  <li className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-tertiary" />
                    <span className="text-sm font-medium opacity-60">All habits have active streaks</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-8 p-4 bg-surface-container-highest/30 border border-outline-variant/10 italic text-on-surface-variant/80 text-sm leading-relaxed">
            {overallRate >= 80
              ? '"System integrity remains high. Velocity has stabilised in the upper decile. Recommendation: Increase resistance in Cognitive Focus segment to maintain growth trajectory."'
              : overallRate >= 50
              ? '"Momentum is building. Focus on consistency over intensity. Each completed protocol compounds your performance architecture."'
              : '"Begin with one high-leverage habit. Establish the neurological baseline before adding complexity to the system."'}
          </div>
        </div>
      </div>

    </div>
  );
}
