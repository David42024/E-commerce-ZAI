import prisma from '../lib/prisma';

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
