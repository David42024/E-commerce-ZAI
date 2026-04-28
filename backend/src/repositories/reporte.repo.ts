import prisma from '../lib/prisma';

export class ReporteRepository {
  private mapOrdenReporte(row: any) {
    return {
      id: row.id,
      numeroOrden: row.numero_orden,
      totalFinal: row.total_final ?? row.totalFinal,
      created_at: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
      cliente: {
        nombre: row.cliente_nombre,
        apellido: row.cliente_apellido
      },
      estado: {
        nombre: row.estado_nombre
      }
    };
  }

  
  /**
   * Datos crudos para el reporte operativo de órdenes
   */
  async getOrdenesByDateRange(fechaInicio: Date, fechaFin: Date) {
    const ordenes = await prisma.$queryRaw<any[]>`
      SELECT
        o.id,
        o.numero_orden,
        o."totalFinal" AS total_final,
        o.created_at,
        c.nombre AS cliente_nombre,
        c.apellido AS cliente_apellido,
        e.nombre AS estado_nombre
      FROM ord_ordenes o
      INNER JOIN cli_clientes c ON c.id = o.cliente_id
      INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
      WHERE o.created_at >= ${fechaInicio}
        AND o.created_at <= ${fechaFin}
      ORDER BY o.created_at DESC
    `;

    return ordenes.map(row => this.mapOrdenReporte(row));
  }

  /**
   * Datos para gráficos del Dashboard: Ventas diarias
   */
  async getVentasDiarias(fechaInicio: Date, fechaFin: Date) {
    // Formatea la fecha en PostgreSQL a 'YYYY-MM-DD' para agrupar correctamente
    return prisma.$queryRaw`
      SELECT 
        TO_CHAR(o.created_at, 'YYYY-MM-DD') as fecha,
        COUNT(o.id)::int as total_ordenes,
        SUM(o."totalFinal") as ventas_totales
      FROM ord_ordenes o
      INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
      WHERE o.created_at >= ${fechaInicio} AND o.created_at <= ${fechaFin}
        AND e.nombre NOT IN ('PENDIENTE', 'CANCELADA')
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM-DD')
      ORDER BY fecha ASC
    `;
  }

  /**
   * Datos para gráficos: Ventas por categoría
   */
  async getVentasPorCategoria(fechaInicio: Date, fechaFin: Date) {
    return prisma.$queryRaw`
      SELECT 
        c.nombre as categoria,
        SUM(oi.subtotal) as total_ventas,
        SUM(oi.cantidad) as unidades_vendidas
      FROM ord_items_orden oi
      JOIN cat_productos p ON oi.producto_id = p.id
      JOIN cat_categorias c ON p.categoria_id = c.id
      JOIN ord_ordenes o ON oi.orden_id = o.id
      INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
      WHERE o.created_at >= ${fechaInicio} AND o.created_at <= ${fechaFin}
        AND e.nombre NOT IN ('PENDIENTE', 'CANCELADA')
      GROUP BY c.nombre
      ORDER BY total_ventas DESC
      LIMIT 5
    `;
  }

  /**
   * Obtiene los productos más vendidos
   */
  async getProductosMasVendidos(fechaInicio: Date, fechaFin: Date, limit: number = 5) {
    return prisma.$queryRaw`
      SELECT 
        p.id,
        p.nombre,
        p.sku,
        SUM(oi.cantidad) as total_vendido,
        SUM(oi.subtotal) as ingresos_generados
      FROM ord_items_orden oi
      JOIN cat_productos p ON oi.producto_id = p.id
      JOIN ord_ordenes o ON oi.orden_id = o.id
      INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
      WHERE o.created_at >= ${fechaInicio} AND o.created_at <= ${fechaFin}
        AND e.nombre NOT IN ('PENDIENTE', 'CANCELADA')
      GROUP BY p.id, p.nombre, p.sku
      ORDER BY total_vendido DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Obtiene resumen financiero (Ingresos vs Costos)
   */
  async getResumenFinanciero(fechaInicio: Date, fechaFin: Date) {
    return prisma.$queryRaw`
      SELECT 
        SUM(oi.subtotal) as ingresos_brutos,
        SUM(oi.cantidad * p.precio_costo) as costo_mercancia_vendida,
        SUM(oi.subtotal - (oi.cantidad * p.precio_costo)) as utilidad_bruta
      FROM ord_items_orden oi
      JOIN cat_productos p ON oi.producto_id = p.id
      JOIN ord_ordenes o ON oi.orden_id = o.id
      INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
      WHERE o.created_at >= ${fechaInicio} AND o.created_at <= ${fechaFin}
        AND e.nombre NOT IN ('PENDIENTE', 'CANCELADA')
    `;
  }

  /**
   * Datos para KPIs: Tasa de conversión (Carritos creados vs Órdenes completadas)
   */
  async getConversionStats(fechaInicio: Date, fechaFin: Date) {
    const [carritos, ordenes] = await Promise.all([
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM ord_carritos
        WHERE updated_at >= ${fechaInicio}
          AND updated_at <= ${fechaFin}
      `,
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM ord_ordenes o
        INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
        WHERE o.created_at >= ${fechaInicio}
          AND o.created_at <= ${fechaFin}
          AND e.nombre != 'CANCELADA'
      `
    ]);

    return {
      carritos_creados: Number(carritos[0]?.total || 0),
      ordenes_completadas: Number(ordenes[0]?.total || 0)
    };
  }

  /**
   * Obtiene los KPIs principales para el dashboard
   */
  async getKpisPrincipales(fechaInicio: Date, fechaFin: Date) {
    const [ventas, totalOrdenes, totalClientes, productosBajoStock] = await Promise.all([
      prisma.$queryRaw<{ ingresos_totales: any; ticket_promedio: any }[]>`
        SELECT
          COALESCE(SUM(o."totalFinal"), 0) AS ingresos_totales,
          COALESCE(AVG(o."totalFinal"), 0) AS ticket_promedio
        FROM ord_ordenes o
        INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
        WHERE o.created_at >= ${fechaInicio}
          AND o.created_at <= ${fechaFin}
          AND e.nombre NOT IN ('PENDIENTE', 'CANCELADA')
      `,
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM ord_ordenes
        WHERE created_at >= ${fechaInicio}
          AND created_at <= ${fechaFin}
      `,
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM cli_clientes
        WHERE created_at >= ${fechaInicio}
          AND created_at <= ${fechaFin}
      `,
      prisma.$queryRaw<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM inv_stock_producto
        WHERE stock_fisico <= stock_minimo
      `
    ]);

    return {
      ingresosTotales: Number(ventas[0]?.ingresos_totales || 0),
      ticketPromedio: Number(ventas[0]?.ticket_promedio || 0),
      totalOrdenes: Number(totalOrdenes[0]?.total || 0),
      totalClientes: Number(totalClientes[0]?.total || 0),
      productosBajoStock: Number(productosBajoStock[0]?.total || 0)
    };
  }

  /**
   * Obtiene las órdenes recientes para el dashboard
   */
  async getOrdenesRecientes(limit: number = 5) {
    const ordenes = await prisma.$queryRaw<any[]>`
      SELECT
        o.id,
        o.numero_orden,
        o."totalFinal" AS total_final,
        o.created_at,
        c.nombre AS cliente_nombre,
        c.apellido AS cliente_apellido,
        e.nombre AS estado_nombre
      FROM ord_ordenes o
      INNER JOIN cli_clientes c ON c.id = o.cliente_id
      INNER JOIN ord_estados_orden e ON e.id = o.estado_orden_id
      ORDER BY o.created_at DESC
      LIMIT ${limit}
    `;

    return ordenes.map(row => this.mapOrdenReporte(row));
  }

  /**
   * Obtiene la actividad reciente del sistema
   */
  async getActividadReciente(limit: number = 10) {
    return prisma.auditoriaRegistro.findMany({
      take: limit,
      orderBy: { fechaAccion: 'desc' },
      include: {
        usuarioEjecutor: {
          select: { correo: true }
        }
      }
    });
  }

  /**
   * Obtiene el inventario actual para reportes
   */
  async getInventarioParaReporte() {
    return prisma.invStockProducto.findMany({
      include: {
        producto: {
          include: {
            categoria: true
          }
        }
      },
      orderBy: {
        producto: {
          nombre: 'asc'
        }
      }
    });
  }

  /**
   * Obtiene los clientes para reportes con sus métricas
   */
  async getClientesParaReporte(fechaInicio: Date, fechaFin: Date) {
    const clientes = await prisma.$queryRaw<any[]>`
      SELECT
        c.id,
        c.nombre,
        c.apellido,
        c.documento_identidad AS dni,
        c.created_at,
        u.correo,
        COUNT(o.id)::int AS ordenes
      FROM cli_clientes c
      INNER JOIN seg_usuarios u ON u.id = c.usuario_id
      LEFT JOIN ord_ordenes o ON o.cliente_id = c.id
      WHERE c.created_at >= ${fechaInicio}
        AND c.created_at <= ${fechaFin}
      GROUP BY c.id, c.nombre, c.apellido, c.documento_identidad, c.created_at, u.correo
      ORDER BY c.created_at DESC
    `;

    return clientes.map(cliente => ({
      ...cliente,
      usuario: {
        correo: cliente.correo
      },
      _count: {
        ordenes: Number(cliente.ordenes || 0)
      }
    }));
  }

  /**
   * Obtiene la actividad reciente del sistema con paginación y filtros
   */
  async getLogsActividad(dto: any) {
    const { page = 1, limit = 10, search = '', fechaInicio, fechaFin } = dto;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(search && {
        OR: [
          { accion: { contains: search, mode: 'insensitive' } },
          { tablaAfectada: { contains: search, mode: 'insensitive' } },
          { usuarioEjecutor: { correo: { contains: search, mode: 'insensitive' } } }
        ]
      }),
      ...(fechaInicio || fechaFin ? {
        fechaAccion: {
          ...(fechaInicio && { gte: new Date(fechaInicio) }),
          ...(fechaFin && { lte: new Date(new Date(fechaFin).setHours(23, 59, 59, 999)) }),
        }
      } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.auditoriaRegistro.count({ where }),
      prisma.auditoriaRegistro.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaAccion: 'desc' },
        include: {
          usuarioEjecutor: {
            select: { correo: true }
          }
        }
      })
    ]);

    return { total, data };
  }
}