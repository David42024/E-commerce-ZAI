import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activeCount = await prisma.catProducto.count({
    where: {
      estado: 'ACTIVO',
      activo: true
    }
  });
  console.log('Active products count:', activeCount);

  const totalCount = await prisma.catProducto.count({
    where: {
      activo: true
    }
  });
  console.log('Total active products (any state):', totalCount);

  const byState = await prisma.catProducto.groupBy({
    by: ['estado'],
    where: { activo: true },
    _count: { _all: true }
  });
  console.log('Products by state:', JSON.stringify(byState, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
