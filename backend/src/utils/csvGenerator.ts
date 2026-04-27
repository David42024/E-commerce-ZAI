export class CsvGenerator {
  private filterData(allColumns: { header: string, key: string }[], data: any[], campos?: string[]) {
    const columns = !campos || campos.length === 0 
      ? allColumns 
      : allColumns.filter(col => campos.includes(col.key));
    
    const headerRow = columns.map(col => `"${col.header}"`).join(',');
    
    const rows = data.map(item => {
      return columns.map(col => {
        let value = item[col.key];
        if (value === null || value === undefined) value = '';
        // Escapar comillas dobles
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
    });

    return [headerRow, ...rows].join('\n');
  }

  async generarReporteOrdenes(ordenes: any[], campos?: string[]) {
    const allColumns = [
      { header: 'ID Orden', key: 'id' },
      { header: 'Fecha', key: 'fecha' },
      { header: 'Cliente', key: 'cliente' },
      { header: 'Total', key: 'total' },
      { header: 'Estado', key: 'estado' }
    ];

    const data = ordenes.map(orden => ({
      id: orden.codigo_seguimiento || orden.id,
      fecha: orden.created_at.toLocaleString(),
      cliente: `${orden.cliente.nombre} ${orden.cliente.apellido}`,
      total: orden.totalFinal,
      estado: orden.estado.nombre
    }));

    return Buffer.from(this.filterData(allColumns, data, campos), 'utf-8');
  }

  async generarReporteInventario(items: any[], campos?: string[]) {
    const allColumns = [
      { header: 'Producto', key: 'producto' },
      { header: 'Categoría', key: 'categoria' },
      { header: 'SKU', key: 'sku' },
      { header: 'Stock Físico', key: 'stock' },
      { header: 'Stock Mínimo', key: 'minimo' },
      { header: 'Estado', key: 'estado' }
    ];

    const data = items.map(item => ({
      producto: item.producto.nombre,
      categoria: item.producto.categoria.nombre,
      sku: item.producto.sku,
      stock: item.stockFisico,
      minimo: item.stockMinimo,
      estado: item.stockFisico <= item.stockMinimo ? 'BAJO STOCK' : 'OK'
    }));

    return Buffer.from(this.filterData(allColumns, data, campos), 'utf-8');
  }

  async generarReporteClientes(clientes: any[], campos?: string[]) {
    const allColumns = [
      { header: 'Nombre', key: 'nombre' },
      { header: 'Apellido', key: 'apellido' },
      { header: 'Correo', key: 'correo' },
      { header: 'DNI', key: 'dni' },
      { header: 'Total Órdenes', key: 'ordenes' },
      { header: 'Fecha Registro', key: 'registro' }
    ];

    const data = clientes.map(cliente => ({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      correo: cliente.usuario.correo,
      dni: cliente.dni,
      ordenes: cliente._count.ordenes,
      registro: cliente.created_at.toLocaleString()
    }));

    return Buffer.from(this.filterData(allColumns, data, campos), 'utf-8');
  }

  async generarReporteFinanciero(resumen: any, campos?: string[]) {
    const allColumns = [
      { header: 'Concepto', key: 'label' },
      { header: 'Monto (S/)', key: 'value' }
    ];

    const allItems = [
      { key: 'ingresos_brutos', label: 'Ingresos Brutos', value: Number(resumen.ingresos_brutos || 0) },
      { key: 'costo_mercancia_vendida', label: 'Costo de Mercancía Vendida', value: Number(resumen.costo_mercancia_vendida || 0) },
      { key: 'utilidad_bruta', label: 'Utilidad Bruta', value: Number(resumen.utilidad_bruta || 0) }
    ];

    const data = allItems
      .filter(item => !campos || campos.length === 0 || campos.includes(item.key))
      .map(item => ({
        label: item.label,
        value: item.value.toFixed(2)
      }));

    return Buffer.from(this.filterData(allColumns, data), 'utf-8');
  }

  async generarReporteMasVendidos(productos: any[], campos?: string[]) {
    const allColumns = [
      { header: 'SKU', key: 'sku' },
      { header: 'Producto', key: 'nombre' },
      { header: 'Unidades Vendidas', key: 'total_vendido' },
      { header: 'Ingresos Generados', key: 'ingresos_generados' }
    ];

    const data = productos.map(p => ({
      sku: p.sku,
      nombre: p.nombre,
      total_vendido: Number(p.total_vendido),
      ingresos_generados: Number(p.ingresos_generados).toFixed(2)
    }));

    return Buffer.from(this.filterData(allColumns, data, campos), 'utf-8');
  }
}
