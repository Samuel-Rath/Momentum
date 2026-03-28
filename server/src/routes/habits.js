const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/habits
router.get('/', async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.userId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(habits);
});

// POST /api/habits
router.post('/', async (req, res) => {
  const { name, category, frequency, color, icon } = req.body;
  if (!name || !category || !frequency) {
    return res.status(400).json({ error: 'name, category, and frequency required' });
  }
  const habit = await prisma.habit.create({
    data: { name, category, frequency, color, icon, userId: req.userId },
  });
  res.status(201).json(habit);
});

// PUT /api/habits/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const habit = await prisma.habit.findFirst({ where: { id, userId: req.userId } });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const { name, category, frequency, color, icon } = req.body;
  const updated = await prisma.habit.update({
    where: { id },
    data: { name, category, frequency, color, icon },
  });
  res.json(updated);
});

// DELETE /api/habits/:id  (soft delete)
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const habit = await prisma.habit.findFirst({ where: { id, userId: req.userId } });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  await prisma.habit.update({ where: { id }, data: { isActive: false } });
  res.json({ success: true });
});

module.exports = router;
