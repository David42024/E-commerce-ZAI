
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const estados = await prisma.ordEstadoOrden.findMany();
  console.log(JSON.stringify(estados, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
