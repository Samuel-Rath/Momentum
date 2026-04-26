const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d) {
  return new Date(d).toISOString().split('T')[0];
}

function dayDiff(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}

// Sunday-anchored ISO date for the start of the week containing `d`.
function weekKey(d) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  return toDateStr(x);
}

/**
 * Convert a habit's `frequency` field into the cadence the analytics should
 * score against. "daily" and unknown values default to per-day; "weekly"
 * scores per-week (one slot per ISO week). Custom is treated as daily until
 * the schema gains a per-habit cadence config.
 */
function cadenceOf(habit) {
  return habit.frequency === 'weekly' ? 'weekly' : 'daily';
}

/**
 * How many "slots" the habit was expected to fill across the window. A
 * daily habit has one slot per day; a weekly habit has one slot per ISO
 * week that overlaps the window. Floors to 1 so a tiny window still has a
 * denominator.
 */
function expectedSlots(habit, days, windowStart, now) {
  if (cadenceOf(habit) === 'weekly') {
    const weeks = new Set();
    for (let i = 0; i < days; i++) {
      const d = new Date(windowStart);
      d.setDate(d.getDate() + i);
      if (d > now) break;
      weeks.add(weekKey(d));
    }
    return Math.max(1, weeks.size);
  }
  return Math.max(1, days);
}

/**
 * How many of those slots were actually filled. For daily habits this is
 * the count of completed logs in the window; for weekly habits it's the
 * count of distinct ISO weeks that contain at least one completed log.
 */
function completedSlots(habit, hLogs) {
  if (cadenceOf(habit) === 'weekly') {
    const weeks = new Set();
    for (const l of hLogs) {
      if (l.completed) weeks.add(weekKey(l.date));
    }
    return weeks.size;
  }
  return hLogs.filter((l) => l.completed).length;
}

/**
 * Slot-rate series for the sparkline. For daily habits this matches the
 * old behaviour (per-day or per-bucket completion ratio). For weekly
 * habits each bucket is "did any week ending in this bucket get completed"
 * which keeps the sparkline visually meaningful at weekly cadence too.
 */
function buildSeries(habit, hLogs, seriesDates) {
  const cadence = cadenceOf(habit);

  if (cadence === 'weekly') {
    return seriesDates.map(({ start, end }) => {
      const bucketWeeks = new Set();
      const completedWeeks = new Set();
      // Walk each day in the bucket so we account for partial weeks at edges.
      const cursor = new Date(start);
      while (cursor <= end) {
        bucketWeeks.add(weekKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      for (const l of hLogs) {
        if (!l.completed) continue;
        const d = new Date(l.date);
        if (d >= start && d <= end) completedWeeks.add(weekKey(d));
      }
      const expected = bucketWeeks.size;
      return expected > 0 ? completedWeeks.size / expected : null;
    });
  }

  return seriesDates.map(({ start, end }) => {
    const bucket = hLogs.filter((l) => {
      const d = new Date(l.date);
      return d >= start && d <= end;
    });
    const t = bucket.length;
    const c = bucket.filter((l) => l.completed).length;
    return t > 0 ? c / t : null;
  });
}

/**
 * Build a professional performance report across a rolling window.
 * Frequency-aware: each habit is scored against its own cadence so a
 * weekly habit completed once a week reads as 100%, not 14%.
 */
function buildPerformanceReport(habits, logs, days) {
  const now = new Date();
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - (days - 1));

  const inWindow = logs.filter((l) => {
    const d = new Date(l.date);
    return d >= windowStart && d <= now;
  });

  // ── Day-of-week matrix (raw log-level — observed engagement, not target) ──
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

  // ── Pre-compute per-habit slot accounting (used by category, summary, table) ──
  const halfWindow = Math.floor(days / 2);
  const recentCut = new Date();
  recentCut.setDate(recentCut.getDate() - halfWindow);

  const seriesPoints = Math.min(days, 30);
  const bucketSize = Math.ceil(days / seriesPoints);
  const seriesDates = [];
  for (let i = seriesPoints - 1; i >= 0; i--) {
    const end = new Date();
    end.setDate(end.getDate() - i * bucketSize);
    const start = new Date(end);
    start.setDate(start.getDate() - (bucketSize - 1));
    seriesDates.push({ start, end });
  }

  const habitRows = habits.map((h) => {
    const cadence = cadenceOf(h);
    const hLogs = inWindow.filter((l) => l.habitId === h.id);

    const expected = expectedSlots(h, days, windowStart, now);
    const completed = completedSlots(h, hLogs);
    const rate = expected > 0 ? Math.min(1, completed / expected) : 0;

    const series = buildSeries(h, hLogs, seriesDates);

    // Consistency: stddev of the slot-level rate across the window.
    // Daily habits → daily rate per day; weekly → per-week completion (0/1).
    let slotRates;
    if (cadence === 'weekly') {
      const byWeek = new Map();
      // Initialize all weeks in window so missed weeks count as 0.
      const cursor = new Date(windowStart);
      while (cursor <= now) {
        byWeek.set(weekKey(cursor), 0);
        cursor.setDate(cursor.getDate() + 1);
      }
      for (const l of hLogs) {
        if (l.completed) byWeek.set(weekKey(l.date), 1);
      }
      slotRates = [...byWeek.values()];
    } else {
      const byDay = new Map();
      const cursor = new Date(windowStart);
      while (cursor <= now) {
        byDay.set(toDateStr(cursor), { c: 0, t: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
      for (const l of hLogs) {
        const k = toDateStr(l.date);
        const cur = byDay.get(k);
        if (!cur) continue;
        cur.t++;
        if (l.completed) cur.c++;
      }
      // For days the user didn't log this habit at all, treat as a miss (0).
      // This is what makes the consistency reflect adherence, not just bias.
      slotRates = [...byDay.values()].map((d) => (d.t > 0 ? d.c / d.t : 0));
    }

    let consistency = 0;
    if (slotRates.length >= 3) {
      const mean = slotRates.reduce((s, r) => s + r, 0) / slotRates.length;
      const variance = slotRates.reduce((s, r) => s + (r - mean) ** 2, 0) / slotRates.length;
      const stdev = Math.sqrt(variance);
      consistency = Math.max(0, 1 - stdev);
    } else if (slotRates.length > 0) {
      consistency = slotRates[0];
    }

    // Momentum — recent half vs earlier half, slot-rate based
    const recentLogs = hLogs.filter((l) => new Date(l.date) >= recentCut);
    const earlierLogs = hLogs.filter((l) => new Date(l.date) < recentCut);
    const recentDays = Math.max(1, dayDiff(now, recentCut));
    const earlierDays = Math.max(1, days - recentDays);
    const rRate = computeHalfRate(h, recentLogs, recentDays);
    const eRate = computeHalfRate(h, earlierLogs, earlierDays);
    const trend = rRate !== null && eRate !== null ? rRate - eRate : 0;

    // Last-active days ago
    const sortedLogs = [...hLogs]
      .filter((l) => l.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastActive = sortedLogs[0]
      ? dayDiff(now, sortedLogs[0].date)
      : null;

    const trendNorm = Math.max(-1, Math.min(1, trend));
    const score = 0.5 * rate + 0.3 * consistency + 0.2 * ((trendNorm + 1) / 2);

    return {
      id: h.id,
      name: h.name,
      category: h.category,
      color: h.color,
      icon: h.icon,
      frequency: h.frequency || 'daily',
      cadence,
      expected,
      completed,
      total: hLogs.length, // raw log count (kept for backwards-compat consumers)
      rate,
      consistency,
      trend,
      score,
      lastActive,
      series,
    };
  });

  // ── Category leaderboard — slot-aware ──
  const byCategory = new Map();
  for (const h of habits) {
    const key = h.category || 'uncategorised';
    if (!byCategory.has(key)) {
      byCategory.set(key, { category: key, habits: 0, expected: 0, completed: 0 });
    }
    byCategory.get(key).habits++;
  }
  for (const row of habitRows) {
    const key = row.category || 'uncategorised';
    const bucket = byCategory.get(key);
    if (!bucket) continue;
    bucket.expected += row.expected;
    bucket.completed += row.completed;
  }
  const categories = [...byCategory.values()]
    .map((c) => ({
      category: c.category,
      habits: c.habits,
      total: c.expected, // surface as `total` so existing UI keys still work
      completed: c.completed,
      rate: c.expected > 0 ? Math.min(1, c.completed / c.expected) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // ── Rolling 8-week trend (slot-aware so weekly habits aren't penalised) ──
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    const end = new Date();
    end.setDate(end.getDate() - w * 7);
    const start = new Date();
    start.setDate(start.getDate() - w * 7 - 6);
    const winLogs = logs.filter((l) => {
      const d = new Date(l.date);
      return d >= start && d <= end;
    });

    let expected = 0;
    let completed = 0;
    for (const h of habits) {
      const hWinLogs = winLogs.filter((l) => l.habitId === h.id);
      expected += expectedSlots(h, 7, start, end);
      completed += completedSlots(h, hWinLogs);
    }

    weeks.push({
      label: `W${8 - w}`,
      start: toDateStr(start),
      end: toDateStr(end),
      rate: expected > 0 ? Math.min(1, completed / expected) : 0,
      total: expected,
      completed,
    });
  }

  const withMA = weeks.map((w, i) => {
    const window = weeks.slice(Math.max(0, i - 3), i + 1);
    const valid = window.filter((x) => x.total > 0);
    const ma = valid.length > 0
      ? valid.reduce((s, x) => s + x.rate, 0) / valid.length
      : 0;
    return { ...w, ma };
  });

  // ── Summary — slot-aware roll-up across all habits ──
  const expectedTotal = habitRows.reduce((s, r) => s + r.expected, 0);
  const completedTotal = habitRows.reduce((s, r) => s + r.completed, 0);
  const avgRate = expectedTotal > 0 ? Math.min(1, completedTotal / expectedTotal) : 0;

  const trackedDays = new Set(inWindow.map((l) => toDateStr(l.date))).size;
  const perfectDays = (() => {
    // A "perfect day" is one where every daily-cadence habit logged that day
    // was completed and at least one was logged.
    const dailyHabitIds = new Set(habits.filter((h) => cadenceOf(h) === 'daily').map((h) => h.id));
    const dayMap = new Map();
    for (const l of inWindow) {
      if (!dailyHabitIds.has(l.habitId)) continue;
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

  // Window-over-window delta — slot-aware against the prior same-length window
  const prevStart = new Date();
  prevStart.setDate(prevStart.getDate() - (days * 2 - 1));
  const prevEnd = new Date();
  prevEnd.setDate(prevEnd.getDate() - days);

  let prevExpected = 0;
  let prevCompleted = 0;
  for (const h of habits) {
    const hPrev = logs.filter((l) => {
      if (l.habitId !== h.id) return false;
      const d = new Date(l.date);
      return d >= prevStart && d <= prevEnd;
    });
    prevExpected += expectedSlots(h, days, prevStart, prevEnd);
    prevCompleted += completedSlots(h, hPrev);
  }
  const prevRate = prevExpected > 0 ? Math.min(1, prevCompleted / prevExpected) : null;
  const delta = prevRate !== null ? avgRate - prevRate : null;

  // At-risk — slot-aware: must have at least one expected slot, declining momentum, below 70%
  const atRisk = habitRows
    .filter((h) => h.expected >= 1 && h.trend < -0.1 && h.rate < 0.7)
    .sort((a, b) => a.trend - b.trend)
    .slice(0, 6);

  return {
    period: { days, start: toDateStr(windowStart), end: toDateStr(now) },
    summary: {
      avgRate,
      totalCompleted: completedTotal,
      totalLogs: inWindow.length,
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

// Slot-aware completion rate for an arbitrary sub-window (used by trend/momentum).
function computeHalfRate(habit, hLogs, days) {
  if (days <= 0) return null;
  const cadence = cadenceOf(habit);
  if (cadence === 'weekly') {
    const expected = Math.max(1, Math.ceil(days / 7));
    const completed = completedSlots(habit, hLogs);
    return Math.min(1, completed / expected);
  }
  if (hLogs.length === 0) return null;
  const completed = hLogs.filter((l) => l.completed).length;
  return completed / Math.max(1, days);
}

module.exports = { buildPerformanceReport };
