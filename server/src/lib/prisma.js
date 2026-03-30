const { PrismaClient } = require('@prisma/client');

// Singleton — prevents multiple connection pools across route files
const prisma = new PrismaClient();

module.exports = prisma;
