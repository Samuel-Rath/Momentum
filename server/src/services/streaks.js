/**
 * Compute current and longest completion streaks from a habit's log history.
 *
 * @param {Array<{ date: Date|string, completed: boolean }>} logs
 * @returns {{ currentStreak: number, longestStreak: number }}
 *   currentStreak — consecutive days ending on today or yesterday (0 if broken)
 *   longestStreak — longest consecutive run ever recorded
 */
function computeStreaks(logs) {
  const sorted = [...logs]
    .filter((l) => l.completed)
    .map((l) => new Date(l.date).toISOString().split('T')[0])
    .sort();

  if (sorted.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dates = [...new Set(sorted)];

  let longestStreak = 1;
  let run = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }

  // Current streak — walk back from today
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  const dateSet = new Set(dates);

  // Allow today or yesterday as start of active streak
  if (!dateSet.has(today) && !dateSet.has(yesterday)) {
    return { currentStreak: 0, longestStreak };
  }

  let cursor = dateSet.has(today) ? today : yesterday;
  while (dateSet.has(cursor)) {
    currentStreak++;
    const prev = new Date(new Date(cursor).getTime() - 86400000)
      .toISOString()
      .split('T')[0];
    cursor = prev;
  }

  return { currentStreak, longestStreak };
}

module.exports = { computeStreaks };
