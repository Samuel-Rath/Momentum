const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d) {
  return new Date(d).toISOString().split('T')[0];
}

function dayDiff(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}

/**
 * Build a professional performance report across a rolling window.
 * @param {Array} habits - active habits with { id, name, category, color, icon }
 * @param {Array} logs   - HabitLog records inside (or overlapping) the window
 * @param {number} days  - window size (7 | 30 | 90)
 */
function buildPerformanceReport(habits, logs, days) {
  const now = new Date();
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - (days - 1));

  const inWindow = logs.filter((l) => {
    const d = new Date(l.date);
    return d >= windowStart && d <= now;
  });

  // ── Day-of-week matrix ──
  const dow = Array.from({ length: 7 }, (_, i) => ({
    day: DAYS[i],
    idx: i,
    completed: 0,
    total: 0,
    rate: 0,
  }));
  for (const l of inWindow) {
    const i = new Date(l.date).getDay();
    dow[i].total++;
    if (l.completed) dow[i].completed++;
  }
  for (const d of dow) d.rate = d.total > 0 ? d.completed / d.total : 0;

  // ── Category leaderboard ──
  const byCategory = new Map();
  for (const h of habits) {
    const key = h.category || 'uncategorised';
    if (!byCategory.has(key)) {
      byCategory.set(key, { category: key, habits: 0, completed: 0, total: 0 });
    }
    byCategory.get(key).habits++;
  }
  for (const l of inWindow) {
    const h = habits.find((x) => x.id === l.habitId);
    if (!h) continue;
    const key = h.category || 'uncategorised';
    const bucket = byCategory.get(key);
    if (!bucket) continue;
    bucket.total++;
    if (l.completed) bucket.completed++;
  }
  const categories = [...byCategory.values()]
    .map((c) => ({
      ...c,
      rate: c.total > 0 ? c.completed / c.total : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // ── Rolling weekly trend (last 8 weeks regardless of window for trend context) ──
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    const start = new Date();
    start.setDate(start.getDate() - w * 7 - 6);
    const weekLogs = logs.filter((l) => {
      const d = new Date(l.date);
      return d >= start && d <= end;
    });
    const completed = weekLogs.filter((l) => l.completed).length;
    const total = weekLogs.length;
    weeks.push({
      label: `W${8 - w}`,
      start: toDateStr(start),
      end: toDateStr(end),
      rate: total > 0 ? completed / total : 0,
      total,
      completed,
    });
  }

  // 4-week moving average (client-friendly smoothing)
  const withMA = weeks.map((w, i) => {
    const window = weeks.slice(Math.max(0, i - 3), i + 1);
    const valid = window.filter((x) => x.total > 0);
    const ma = valid.length > 0
      ? valid.reduce((s, x) => s + x.rate, 0) / valid.length
      : 0;
    return { ...w, ma };
  });

  // ── Per-habit performance scoring ──
  const halfWindow = Math.floor(days / 2);
  const recentCut = new Date();
  recentCut.setDate(recentCut.getDate() - halfWindow);

  const habitRows = habits.map((h) => {
    const hLogs = inWindow.filter((l) => l.habitId === h.id);
    const total = hLogs.length;
    const completed = hLogs.filter((l) => l.completed).length;
    const rate = total > 0 ? completed / total : 0;

    // Consistency — stddev of daily completion (lower is more consistent, inverted to 0..1)
    const byDay = new Map();
    for (const l of hLogs) {
      const k = toDateStr(l.date);
      const cur = byDay.get(k) || { c: 0, t: 0 };
      cur.t++;
      if (l.completed) cur.c++;
      byDay.set(k, cur);
    }
    const rates = [...byDay.values()].map((d) => (d.t > 0 ? d.c / d.t : 0));
    let consistency = 0;
    if (rates.length >= 3) {
      const mean = rates.reduce((s, r) => s + r, 0) / rates.length;
      const variance = rates.reduce((s, r) => s + (r - mean) ** 2, 0) / rates.length;
      const stdev = Math.sqrt(variance);
      consistency = Math.max(0, 1 - stdev);
    } else if (rates.length > 0) {
      consistency = rates[0];
    }

    // Momentum — recent half vs earlier half
    const recent = hLogs.filter((l) => new Date(l.date) >= recentCut);
    const earlier = hLogs.filter((l) => new Date(l.date) < recentCut);
    const rRate = recent.length > 0 ? recent.filter((l) => l.completed).length / recent.length : null;
    const eRate = earlier.length > 0 ? earlier.filter((l) => l.completed).length / earlier.length : null;
    const trend = rRate !== null && eRate !== null ? rRate - eRate : 0;

    // Last-active days ago
    const sortedLogs = [...hLogs]
      .filter((l) => l.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastActive = sortedLogs[0]
      ? dayDiff(now, sortedLogs[0].date)
      : null;

    // Composite score: 0.5 × rate + 0.3 × consistency + 0.2 × normalized momentum
    const trendNorm = Math.max(-1, Math.min(1, trend));
    const score = 0.5 * rate + 0.3 * consistency + 0.2 * ((trendNorm + 1) / 2);

    return {
      id: h.id,
      name: h.name,
      category: h.category,
      color: h.color,
      icon: h.icon,
      total,
      completed,
      rate,
      consistency,
      trend,
      score,
      lastActive,
    };
  });

  // ── Summary metrics ──
  const totalCompleted = inWindow.filter((l) => l.completed).length;
  const totalLogs = inWindow.length;
  const avgRate = totalLogs > 0 ? totalCompleted / totalLogs : 0;

  const trackedDays = new Set(inWindow.map((l) => toDateStr(l.date))).size;
  const perfectDays = (() => {
    const dayMap = new Map();
    for (const l of inWindow) {
      const k = toDateStr(l.date);
      const cur = dayMap.get(k) || { c: 0, t: 0 };
      cur.t++;
      if (l.completed) cur.c++;
      dayMap.set(k, cur);
    }
    let n = 0;
    for (const d of dayMap.values()) if (d.t > 0 && d.c === d.t) n++;
    return n;
  })();

  // Best/worst day-of-week (only if enough samples)
  const validDow = dow.filter((d) => d.total >= Math.max(2, Math.floor(days / 14)));
  const bestDow = validDow.length > 0 ? validDow.reduce((a, b) => (a.rate > b.rate ? a : b)) : null;
  const worstDow = validDow.length > 0 ? validDow.reduce((a, b) => (a.rate < b.rate ? a : b)) : null;

  // Window-over-window delta (this window vs previous window of same size)
  const prevStart = new Date();
  prevStart.setDate(prevStart.getDate() - (days * 2 - 1));
  const prevEnd = new Date();
  prevEnd.setDate(prevEnd.getDate() - days);
  const prevLogs = logs.filter((l) => {
    const d = new Date(l.date);
    return d >= prevStart && d <= prevEnd;
  });
  const prevRate = prevLogs.length > 0
    ? prevLogs.filter((l) => l.completed).length / prevLogs.length
    : null;
  const delta = prevRate !== null ? avgRate - prevRate : null;

  // At-risk — dropping momentum and below 70%
  const atRisk = habitRows
    .filter((h) => h.total >= 3 && h.trend < -0.1 && h.rate < 0.7)
    .sort((a, b) => a.trend - b.trend)
    .slice(0, 6);

  return {
    period: { days, start: toDateStr(windowStart), end: toDateStr(now) },
    summary: {
      avgRate,
      totalCompleted,
      totalLogs,
      trackedDays,
      perfectDays,
      delta,
      prevRate,
      activeHabits: habits.length,
    },
    dayOfWeek: dow,
    bestDow,
    worstDow,
    categories,
    weeks: withMA,
    habits: habitRows,
    atRisk,
  };
}

module.exports = { buildPerformanceReport };
