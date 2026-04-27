
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const estados = await prisma.ordEstadoOrden.findMany();
  console.log('Estados de Orden:', estados);
  
  const usuarios = await prisma.segUsuario.findMany({ take: 5 });
  console.log('Algunos Usuarios:', usuarios.map(u => ({ id: u.id, correo: u.correo })));

  const ordenes = await prisma.ordOrden.findMany({ take: 5 });
  console.log('Algunas Ordenes:', ordenes.map(o => ({ id: o.id, numero: o.numeroOrden })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
