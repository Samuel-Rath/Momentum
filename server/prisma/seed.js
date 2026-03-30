require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@momentum.app' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@momentum.app',
      password: hash,
    },
  });

  const habits = [
    { name: 'Morning Workout', category: 'health', frequency: 'daily', color: '#F97316', icon: '💪' },
    { name: 'Read 20 Pages', category: 'learning', frequency: 'daily', color: '#8B5CF6', icon: '📚' },
    { name: 'Drink 2L Water', category: 'health', frequency: 'daily', color: '#22C55E', icon: '💧' },
    { name: 'Meditate', category: 'mindfulness', frequency: 'daily', color: '#3B82F6', icon: '🧘' },
  ];

  for (const h of habits) {
    const habit = await prisma.habit.upsert({
      where: { id: (await prisma.habit.findFirst({ where: { userId: user.id, name: h.name } }))?.id || 0 },
      update: {},
      create: { ...h, userId: user.id },
    });

    // Seed 30 days of logs
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const completed = Math.random() > 0.3;
      await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: habit.id, date } },
        update: {},
        create: { habitId: habit.id, date, completed },
      });
    }
  }

  console.log('Seed complete — demo@momentum.app / demo1234');
}

main().catch(console.error).finally(() => prisma.$disconnect());
