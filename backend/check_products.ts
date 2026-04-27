import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.catProducto.findMany({
    select: {
      id: true,
      nombre: true,
      sku: true,
      estado: true,
      activo: true,
      stock: {
        select: {
          stockFisico: true
        }
      }
    },
    where: {
      activo: true
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  console.log('Total products found:', products.length);
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
