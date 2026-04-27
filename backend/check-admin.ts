import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmin() {
  const admin = await prisma.segUsuario.findUnique({
    where: { correo: 'admin@zai.com' },
    include: {
      roles: {
        include: {
          rol: true
        }
      }
    }
  });

  if (!admin) {
    console.log('Admin user not found');
  } else {
    console.log('Admin user found:', JSON.stringify(admin, null, 2));
  }

  const allRoles = await prisma.segRol.findMany();
  console.log('All roles:', JSON.stringify(allRoles, null, 2));

  await prisma.$disconnect();
}

checkAdmin();
