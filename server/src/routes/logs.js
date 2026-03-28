const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/logs?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];
  const date = new Date(dateStr + 'T00:00:00.000Z');

  const habits = await prisma.habit.findMany({
    where: { userId: req.userId, isActive: true },
    include: {
      logs: {
        where: { date },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const result = habits.map((h) => ({
    id: h.id,
    name: h.name,
    category: h.category,
    frequency: h.frequency,
    color: h.color,
    icon: h.icon,
    log: h.logs[0] || null,
  }));

  res.json(result);
});

// POST /api/logs  — upsert a log entry
router.post('/', async (req, res) => {
  const { habitId, date, completed, notes } = req.body;
  if (!habitId || !date) {
    return res.status(400).json({ error: 'habitId and date required' });
  }

  // Verify ownership
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: req.userId },
  });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const parsedDate = new Date(date + 'T00:00:00.000Z');

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date: parsedDate } },
    update: { completed: completed ?? false, notes },
    create: { habitId, date: parsedDate, completed: completed ?? false, notes },
  });

  res.json(log);
});

module.exports = router;
