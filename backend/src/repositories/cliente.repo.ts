import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export class ClienteRepository {
  
  async findPerfilByUserId(usuarioId: string) {
    return prisma.cliCliente.findUnique({
      where: { usuarioId },
      include: { 
        direcciones: true, 
        usuario: { select: { correo: true, activo: true } },
        listaDeseos: { include: { items: { include: { producto: { include: { imagenes: { take: 1, orderBy: { orden: 'asc' } } } } } } } }
      }
    });
  }

  async findOrCreateListaDeseos(clienteId: string) {
    return prisma.cliListaDeseos.upsert({
      where: { clienteId },
      update: {},
      create: { clienteId },
      include: { items: true }
    });
  }

  async findItemListaDeseos(listaDeseosId: string, productoId: string) {
    return prisma.cliItemListaDeseos.findUnique({
      where: { listaDeseosId_productoId: { listaDeseosId, productoId } }
    });
  }

  async addItemListaDeseos(tx: Prisma.TransactionClient, listaDeseosId: string, productoId: string) {
    return tx.cliItemListaDeseos.create({
      data: { listaDeseosId, productoId }
    });
  }

  async removeItemListaDeseos(tx: Prisma.TransactionClient, listaDeseosId: string, productoId: string) {
    return tx.cliItemListaDeseos.delete({
      where: { listaDeseosId_productoId: { listaDeseosId, productoId } }
    });
  }

  async updatePerfil(clienteId: string, data: any) {
    return prisma.cliCliente.update({
      where: { id: clienteId },
      data
    });
  }

  async createDireccion(clienteId: string, data: any) {
    return prisma.cliDireccion.create({
      data: { ...data, clienteId }
    });
  }

  async findAll(params: { page: number, limit: number, search: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;
    const searchPattern = `%${search}%`;
    const searchFilter = search
      ? Prisma.sql`
          AND (
            c.nombre ILIKE ${searchPattern}
            OR c.apellido ILIKE ${searchPattern}
            OR COALESCE(c.documento_identidad, '') ILIKE ${searchPattern}
            OR u.correo ILIKE ${searchPattern}
          )
        `
      : Prisma.empty;

    const [totalRows, rows] = await Promise.all([
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM cli_clientes c
        INNER JOIN seg_usuarios u ON u.id = c.usuario_id
        WHERE 1 = 1
        ${searchFilter}
      `,
      prisma.$queryRaw<any[]>`
        SELECT
          c.id,
          c.nombre,
          c.apellido,
          c.documento_identidad AS "documentoIdentidad",
          c.telefono,
          c.created_at,
          u.correo,
          u.activo,
          u.created_at AS usuario_created_at,
          COUNT(o.id)::int AS ordenes_count
        FROM cli_clientes c
        INNER JOIN seg_usuarios u ON u.id = c.usuario_id
        LEFT JOIN ord_ordenes o ON o.cliente_id = c.id
        WHERE 1 = 1
        ${searchFilter}
        GROUP BY c.id, c.nombre, c.apellido, c.documento_identidad, c.telefono, c.created_at, u.correo, u.activo, u.created_at
        ORDER BY c.created_at DESC
        OFFSET ${skip}
        LIMIT ${limit}
      `
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      documentoIdentidad: row.documentoIdentidad,
      telefono: row.telefono,
      created_at: row.created_at,
      usuario: {
        correo: row.correo,
        activo: row.activo,
        created_at: row.usuario_created_at
      },
      _count: {
        ordenes: Number(row.ordenes_count || 0)
      }
    }));

    return {
      total: Number(totalRows[0]?.total || 0),
      data
    };
  }

  async findByIdFull(id: string) {
    const [clientes, direcciones, ordenes, counts] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          c.id,
          c.nombre,
          c.apellido,
          c.documento_identidad AS "documentoIdentidad",
          c.telefono,
          0::numeric AS "limiteCredito",
          0::numeric AS "saldoDeudor",
          c.created_at,
          u.correo,
          u.activo,
          u.created_at AS usuario_created_at
        FROM cli_clientes c
        INNER JOIN seg_usuarios u ON u.id = c.usuario_id
        WHERE c.id = ${id}::uuid
        LIMIT 1
      `,
      prisma.$queryRaw<any[]>`
        SELECT
          d.id,
          d.alias,
          d.direccion,
          d.ciudad,
          d.departamento,
          d.es_principal AS "esPrincipal"
        FROM cli_direcciones d
        WHERE d.cliente_id = ${id}::uuid
        ORDER BY d.es_principal DESC, d.created_at DESC
      `,
      prisma.$queryRaw<any[]>`
        SELECT
          o.id,
          o.numero_orden AS "numeroOrden",
          o.created_at,
          o."totalFinal" AS "totalFinal",
          e.nombre AS estado_nombre
        FROM ord_ordenes o
        INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
        WHERE o.cliente_id = ${id}::uuid
        ORDER BY o.created_at DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM ord_ordenes
        WHERE cliente_id = ${id}::uuid
      `
    ]);

    const cliente = clientes[0];
    if (!cliente) return null;

    return {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      documentoIdentidad: cliente.documentoIdentidad,
      telefono: cliente.telefono,
      limiteCredito: cliente.limiteCredito,
      saldoDeudor: cliente.saldoDeudor,
      created_at: cliente.created_at,
      usuario: {
        correo: cliente.correo,
        activo: cliente.activo,
        created_at: cliente.usuario_created_at
      },
      direcciones,
      ordenes: ordenes.map((orden) => ({
        ...orden,
        estado: {
          nombre: orden.estado_nombre
        }
      })),
      _count: {
        ordenes: Number(counts[0]?.total || 0)
      }
    };
  }
}