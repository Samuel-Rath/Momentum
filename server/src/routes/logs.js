const express = require('express');
const authMiddleware = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authMiddleware);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(str) {
  if (!DATE_RE.test(str)) return null;
  const d = new Date(str + 'T00:00:00.000Z');
  return isNaN(d.getTime()) ? null : d;
}

// GET /api/logs?date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = parseDate(dateStr);
    if (!date) return res.status(400).json({ error: 'Invalid date format — use YYYY-MM-DD' });

    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, isActive: true },
      include: { logs: { where: { date } } },
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
  } catch (err) {
    next(err);
  }
});

// POST /api/logs  — upsert a log entry
router.post('/', async (req, res, next) => {
  try {
    const { habitId, date, completed, notes } = req.body;

    if (!habitId || !date) {
      return res.status(400).json({ error: 'habitId and date required' });
    }
    // Accept only numeric ints (or numeric strings); reject floats, "1abc", etc.
    let id;
    if (typeof habitId === 'number' && Number.isSafeInteger(habitId) && habitId > 0) {
      id = habitId;
    } else if (typeof habitId === 'string' && /^\d+$/.test(habitId)) {
      id = parseInt(habitId, 10);
      if (!Number.isSafeInteger(id)) return res.status(400).json({ error: 'Invalid habitId' });
    } else {
      return res.status(400).json({ error: 'Invalid habitId' });
    }

    const parsedDate = parseDate(String(date));
    if (!parsedDate) return res.status(400).json({ error: 'Invalid date format — use YYYY-MM-DD' });

    // Trim notes to prevent huge payloads slipping past body size limit
    const sanitisedNotes = typeof notes === 'string' ? notes.slice(0, 1000) : null;

    // Verify ownership
    const habit = await prisma.habit.findFirst({ where: { id, userId: req.userId } });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const log = await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: id, date: parsedDate } },
      update: { completed: completed === true, notes: sanitisedNotes },
      create: { habitId: id, date: parsedDate, completed: completed === true, notes: sanitisedNotes },
    });

    res.json(log);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
