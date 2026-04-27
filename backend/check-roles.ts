
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const roles = await prisma.segRol.findMany();
    console.log('Roles found:', roles);
  } catch (e) {
    console.error('Error checking roles:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
