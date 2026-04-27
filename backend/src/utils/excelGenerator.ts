import ExcelJS from 'exceljs';

export class ExcelGenerator {
  private filterColumns(allColumns: any[], campos?: string[]) {
    if (!campos || campos.length === 0) return allColumns;
    return allColumns.filter(col => campos.includes(col.key));
  }

  async generarReporteOrdenes(ordenes: any[], campos?: string[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ordenes');

    const allColumns = [
      { header: 'ID Orden', key: 'id', width: 20 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 }
    ];

    worksheet.columns = this.filterColumns(allColumns, campos);

    ordenes.forEach(orden => {
      const rowData: any = {
        id: orden.codigo_seguimiento || orden.id,
        fecha: orden.created_at.toLocaleString(),
        cliente: `${orden.cliente.nombre} ${orden.cliente.apellido}`,
        total: orden.totalFinal,
        estado: orden.estado.nombre
      };
      worksheet.addRow(rowData);
    });

    // Estilo para la cabecera
    if (worksheet.getRow(1)) {
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generarReporteInventario(items: any[], campos?: string[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');

    const allColumns = [
      { header: 'Producto', key: 'producto', width: 30 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Stock Físico', key: 'stock', width: 15 },
      { header: 'Stock Mínimo', key: 'minimo', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 }
    ];

    worksheet.columns = this.filterColumns(allColumns, campos);

    items.forEach(item => {
      const rowData: any = {
        producto: item.producto.nombre,
        categoria: item.producto.categoria.nombre,
        sku: item.producto.sku,
        stock: item.stockFisico,
        minimo: item.stockMinimo,
        estado: item.stockFisico <= item.stockMinimo ? 'BAJO STOCK' : 'OK'
      };
      worksheet.addRow(rowData);
    });

    if (worksheet.getRow(1)) {
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generarReporteClientes(clientes: any[], campos?: string[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clientes');

    const allColumns = [
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'Correo', key: 'correo', width: 30 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'Total Órdenes', key: 'ordenes', width: 15 },
      { header: 'Fecha Registro', key: 'registro', width: 20 }
    ];

    worksheet.columns = this.filterColumns(allColumns, campos);

    clientes.forEach(cliente => {
      const rowData: any = {
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        correo: cliente.usuario.correo,
        dni: cliente.dni,
        ordenes: cliente._count.ordenes,
        registro: cliente.created_at.toLocaleString()
      };
      worksheet.addRow(rowData);
    });

    if (worksheet.getRow(1)) {
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generarReporteFinanciero(resumen: any, dto: any, campos?: string[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resumen Financiero');

    worksheet.addRow(['Reporte de Estados Financieros']);
    worksheet.addRow([`Periodo: ${dto.fechaInicio} al ${dto.fechaFin}`]);
    worksheet.addRow([]);

    worksheet.addRow(['Concepto', 'Monto (S/)']);
    
    const allItems = [
      { key: 'ingresos_brutos', label: 'Ingresos Brutos', value: Number(resumen.ingresos_brutos || 0) },
      { key: 'costo_mercancia_vendida', label: 'Costo de Mercancía Vendida', value: Number(resumen.costo_mercancia_vendida || 0) },
      { key: 'utilidad_bruta', label: 'Utilidad Bruta', value: Number(resumen.utilidad_bruta || 0) }
    ];

    allItems.forEach(item => {
      if (!campos || campos.length === 0 || campos.includes(item.key)) {
        worksheet.addRow([item.label, item.value]);
      }
    });

    worksheet.getRow(4).font = { bold: true };
    worksheet.getColumn(2).numFmt = '"S/" #,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generarReporteMasVendidos(productos: any[], dto: any, campos?: string[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos Más Vendidos');

    const allColumns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Producto', key: 'nombre', width: 40 },
      { header: 'Unidades Vendidas', key: 'total_vendido', width: 20 },
      { header: 'Ingresos Generados', key: 'ingresos_generados', width: 20 }
    ];

    worksheet.columns = this.filterColumns(allColumns, campos);

    productos.forEach(p => {
      const rowData: any = {
        sku: p.sku,
        nombre: p.nombre,
        total_vendido: Number(p.total_vendido),
        ingresos_generados: Number(p.ingresos_generados)
      };
      worksheet.addRow(rowData);
    });

    if (worksheet.getRow(1)) {
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      
      // Ajustar formato de moneda si la columna existe
      const ingresosCol = worksheet.columns.find(c => c.key === 'ingresos_generados');
      if (ingresosCol && ingresosCol.number) {
        worksheet.getColumn(ingresosCol.number).numFmt = '"S/" #,##0.00';
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
