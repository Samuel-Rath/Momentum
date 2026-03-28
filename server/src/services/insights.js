const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Generate rule-based insight strings from habit + log data.
 * @param {Array} habits - list of habit objects
 * @param {Array} logs   - all HabitLog objects with { habitId, date, completed }
 * @returns {Array<{ type, text, icon }>}
 */
function generateInsights(habits, logs) {
  const insights = [];

  if (!logs.length || !habits.length) return insights;

  // --- 1. Best performing day of week ---
  const dayTotals = Array(7).fill(0).map(() => ({ completed: 0, total: 0 }));
  for (const log of logs) {
    const day = new Date(log.date).getDay();
    dayTotals[day].total++;
    if (log.completed) dayTotals[day].completed++;
  }
  const dayRates = dayTotals.map((d, i) => ({
    day: DAYS[i],
    rate: d.total > 0 ? d.completed / d.total : null,
  }));
  const validDays = dayRates.filter((d) => d.rate !== null);

  if (validDays.length >= 3) {
    const best = validDays.reduce((a, b) => (a.rate > b.rate ? a : b));
    const worst = validDays.reduce((a, b) => (a.rate < b.rate ? a : b));

    if (best.rate > 0.7) {
      insights.push({
        type: 'positive',
        icon: '🌟',
        text: `You perform best on ${best.day}s — ${Math.round(best.rate * 100)}% completion rate.`,
      });
    }
    if (worst.rate < 0.5) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        text: `${worst.day}s are your weakest day — only ${Math.round(worst.rate * 100)}% completion. Consider a lighter schedule.`,
      });
    }
  }

  // --- 2. Most consistent habit ---
  const habitStats = habits.map((h) => {
    const habitLogs = logs.filter((l) => l.habitId === h.id);
    const completed = habitLogs.filter((l) => l.completed).length;
    const rate = habitLogs.length > 0 ? completed / habitLogs.length : 0;
    return { name: h.name, icon: h.icon || '✅', rate, total: habitLogs.length };
  });
  const consistent = habitStats.filter((h) => h.total >= 7).sort((a, b) => b.rate - a.rate)[0];
  if (consistent && consistent.rate > 0.75) {
    insights.push({
      type: 'positive',
      icon: consistent.icon,
      text: `"${consistent.name}" is your most consistent habit at ${Math.round(consistent.rate * 100)}% completion.`,
    });
  }

  // --- 3. Struggling habit ---
  const struggling = habitStats.filter((h) => h.total >= 7).sort((a, b) => a.rate - b.rate)[0];
  if (struggling && struggling.rate < 0.5) {
    insights.push({
      type: 'warning',
      icon: '📉',
      text: `"${struggling.name}" needs attention — only ${Math.round(struggling.rate * 100)}% completion in the last month.`,
    });
  }

  // --- 4. Weekday vs weekend comparison ---
  const weekdayLogs = logs.filter((l) => {
    const d = new Date(l.date).getDay();
    return d !== 0 && d !== 6;
  });
  const weekendLogs = logs.filter((l) => {
    const d = new Date(l.date).getDay();
    return d === 0 || d === 6;
  });

  const weekdayRate =
    weekdayLogs.length > 0
      ? weekdayLogs.filter((l) => l.completed).length / weekdayLogs.length
      : null;
  const weekendRate =
    weekendLogs.length > 0
      ? weekendLogs.filter((l) => l.completed).length / weekendLogs.length
      : null;

  if (weekdayRate !== null && weekendRate !== null) {
    const diff = weekdayRate - weekendRate;
    if (diff > 0.2) {
      insights.push({
        type: 'info',
        icon: '📅',
        text: `You're ${Math.round(diff * 100)}% more consistent on weekdays than weekends. Try to protect your weekend routine.`,
      });
    } else if (diff < -0.2) {
      insights.push({
        type: 'positive',
        icon: '🏖️',
        text: `You actually perform better on weekends! ${Math.round(Math.abs(diff) * 100)}% higher completion than weekdays.`,
      });
    }
  }

  // --- 5. Overall momentum ---
  const last7 = logs.filter((l) => {
    const d = new Date(l.date);
    return d >= new Date(Date.now() - 7 * 86400000);
  });
  const prev7 = logs.filter((l) => {
    const d = new Date(l.date);
    return d >= new Date(Date.now() - 14 * 86400000) && d < new Date(Date.now() - 7 * 86400000);
  });

  const r1 = last7.length > 0 ? last7.filter((l) => l.completed).length / last7.length : null;
  const r2 = prev7.length > 0 ? prev7.filter((l) => l.completed).length / prev7.length : null;

  if (r1 !== null && r2 !== null) {
    const trend = r1 - r2;
    if (trend > 0.1) {
      insights.push({
        type: 'positive',
        icon: '🔥',
        text: `Your momentum is building — up ${Math.round(trend * 100)}% from the previous week. Keep going!`,
      });
    } else if (trend < -0.15) {
      insights.push({
        type: 'warning',
        icon: '📉',
        text: `Your completion rate dropped ${Math.round(Math.abs(trend) * 100)}% this week. Time to refocus.`,
      });
    }
  }

  return insights;
}

module.exports = { generateInsights };
