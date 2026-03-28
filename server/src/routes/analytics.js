const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { computeStreaks } = require('../services/streaks');
const { completionByPeriod, heatmapData } = require('../services/analytics');
const { generateInsights } = require('../services/insights');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/analytics/streaks
router.get('/streaks', async (req, res) => {
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
});

// GET /api/analytics/completion?period=week|month
router.get('/completion', async (req, res) => {
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
});

// GET /api/analytics/heatmap
router.get('/heatmap', async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const logs = await prisma.habitLog.findMany({
    where: {
      habit: { userId: req.userId, isActive: true },
      date: { gte: since },
    },
  });

  res.json(heatmapData(logs));
});

// GET /api/analytics/insights
router.get('/insights', async (req, res) => {
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
});

module.exports = router;
