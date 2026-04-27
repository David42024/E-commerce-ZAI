import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const columns = await prisma.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ord_carritos'`;
    console.log('Columns of ord_carritos:', JSON.stringify(columns, null, 2));
    
    const columnsItems = await prisma.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ord_items_carrito'`;
    console.log('Columns of ord_items_carrito:', JSON.stringify(columnsItems, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
