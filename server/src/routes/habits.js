const express = require('express');
const authMiddleware = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

router.use(authMiddleware);

const VALID_CATEGORIES = ['health', 'mindfulness', 'learning', 'productivity', 'social', 'finance', 'creative', 'other'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'custom'];

// GET /api/habits
router.get('/', async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(habits);
  } catch (err) {
    next(err);
  }
});

// POST /api/habits
router.post('/', async (req, res, next) => {
  try {
    const { name, category, frequency, color, icon } = req.body;

    if (!name || !category || !frequency) {
      return res.status(400).json({ error: 'name, category, and frequency required' });
    }
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({ error: 'name must be 1–100 characters' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (!VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }

    const habit = await prisma.habit.create({
      data: {
        name: name.trim(),
        category,
        frequency,
        color: typeof color === 'string' ? color.slice(0, 20) : null,
        icon: typeof icon === 'string' ? icon.slice(0, 10) : null,
        userId: req.userId,
      },
    });
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
});

// PUT /api/habits/:id
router.put('/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid habit id' });
    const id = parseInt(req.params.id, 10);
    if (!Number.isSafeInteger(id)) return res.status(400).json({ error: 'Invalid habit id' });

    const habit = await prisma.habit.findFirst({ where: { id, userId: req.userId } });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const { name, category, frequency, color, icon } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0 || name.length > 100)) {
      return res.status(400).json({ error: 'name must be 1–100 characters' });
    }
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ error: 'Invalid frequency' });
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category }),
        ...(frequency !== undefined && { frequency }),
        ...(color !== undefined && { color: typeof color === 'string' ? color.slice(0, 20) : null }),
        ...(icon !== undefined && { icon: typeof icon === 'string' ? icon.slice(0, 10) : null }),
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/habits/:id  (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid habit id' });
    const id = parseInt(req.params.id, 10);
    if (!Number.isSafeInteger(id)) return res.status(400).json({ error: 'Invalid habit id' });

    const habit = await prisma.habit.findFirst({ where: { id, userId: req.userId } });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    await prisma.habit.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
