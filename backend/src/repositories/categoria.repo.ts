import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CategoriaRepo {
  async findAll() {
    return prisma.catCategoria.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
  }

  async findById(id: string) {
    return prisma.catCategoria.findUnique({
      where: { id }
    });
  }
}
