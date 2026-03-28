/**
 * Given all logs for a user's habits, build completion data grouped by period.
 * period: 'week' returns last 7 days, 'month' returns last 30 days.
 */
function completionByPeriod(logs, period = 'week') {
  const days = period === 'week' ? 7 : 30;
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(
      (l) => new Date(l.date).toISOString().split('T')[0] === dateStr
    );
    const completed = dayLogs.filter((l) => l.completed).length;
    const total = dayLogs.length;
    result.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }

  return result;
}

/**
 * Returns last 90 days of completion data suitable for a heatmap.
 * Each entry: { date, completed: boolean }
 */
function heatmapData(logs) {
  const result = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(
      (l) => new Date(l.date).toISOString().split('T')[0] === dateStr
    );
    const total = dayLogs.length;
    const completed = dayLogs.filter((l) => l.completed).length;
    result.push({
      date: dateStr,
      rate: total > 0 ? completed / total : null,
    });
  }
  return result;
}

module.exports = { completionByPeriod, heatmapData };
