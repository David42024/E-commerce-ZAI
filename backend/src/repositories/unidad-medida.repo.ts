import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UnidadMedidaRepo {
  async findAll() {
    return prisma.catUnidadMedida.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
  }

  async findById(id: string) {
    return prisma.catUnidadMedida.findUnique({
      where: { id }
    });
  }
}
