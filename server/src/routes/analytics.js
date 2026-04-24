const express = require('express');
const authMiddleware = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { computeStreaks } = require('../services/streaks');
const { completionByPeriod, heatmapData } = require('../services/analytics');
const { generateInsights } = require('../services/insights');
const { buildPerformanceReport } = require('../services/performance');

const router = express.Router();

router.use(authMiddleware);

// GET /api/analytics/streaks
router.get('/streaks', async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, isActive: true },
      include: { logs: true },
    });

    const result = habits.map((h) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      ...computeStreaks(h.logs),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/completion?period=week|month
router.get('/completion', async (req, res, next) => {
  try {
    const period = req.query.period === 'month' ? 'month' : 'week';
    const days = period === 'week' ? 7 : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await prisma.habitLog.findMany({
      where: {
        habit: { userId: req.userId, isActive: true },
        date: { gte: since },
      },
    });

    res.json(completionByPeriod(logs, period));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/heatmap
router.get('/heatmap', async (req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const logs = await prisma.habitLog.findMany({
      where: {
        habit: { userId: req.userId, isActive: true },
        date: { gte: since },
      },
    });

    res.json(heatmapData(logs));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/insights
router.get('/insights', async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, isActive: true },
    });

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const logs = await prisma.habitLog.findMany({
      where: {
        habit: { userId: req.userId, isActive: true },
        date: { gte: since },
      },
    });

    res.json(generateInsights(habits, logs));
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/performance?period=7|30|90
// Rich professional rollup: day-of-week matrix, category leaderboard,
// rolling 8-week trend with 4-week MA, per-habit scoring, at-risk watchlist.
router.get('/performance', async (req, res, next) => {
  try {
    const parsed = parseInt(req.query.period, 10);
    const days = [7, 30, 90].includes(parsed) ? parsed : 30;

    // Pull enough history for both the active window and window-over-window
    // delta, plus the 8-week trend lookback — whichever is longest.
    const lookback = Math.max(days * 2, 8 * 7);
    const since = new Date();
    since.setDate(since.getDate() - lookback);

    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, isActive: true },
    });

    const logs = await prisma.habitLog.findMany({
      where: {
        habit: { userId: req.userId, isActive: true },
        date: { gte: since },
      },
    });

    res.json(buildPerformanceReport(habits, logs, days));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
