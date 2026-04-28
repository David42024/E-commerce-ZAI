import prisma from '../lib/prisma';

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
