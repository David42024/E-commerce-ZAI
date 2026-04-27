import PDFDocument from 'pdfkit';

export class PdfGenerator {
  
  async generarReporteOrdenes(ordenes: any[], campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Encabezado
      doc.fontSize(20).text('Reporte de Órdenes', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-PE')}`);
      doc.moveDown(2);

      // Tabla simplificada
      ordenes.forEach((orden, index) => {
        const id = orden.codigo_seguimiento || orden.id;
        const total = `S/ ${orden.totalFinal}`;
        const cliente = `${orden.cliente.nombre} ${orden.cliente.apellido}`;
        const estado = orden.estado.nombre;
        const fecha = orden.created_at.toLocaleString();

        const data: any = { id, total, cliente, estado, fecha };
        const labels: any = { id: 'ID', total: 'Total', cliente: 'Cliente', estado: 'Estado', fecha: 'Fecha' };

        doc.fontSize(12).fillColor('black').text(`Orden #${index + 1}: ${id}`);
        
        if (campos && campos.length > 0) {
          campos.forEach(campo => {
            if (campo !== 'id' && data[campo]) {
              doc.fontSize(10).fillColor('gray').text(`${labels[campo] || campo}: ${data[campo]}`);
            }
          });
        } else {
          doc.fontSize(10).fillColor('gray').text(`Total: ${total} | Cliente: ${cliente} | Estado: ${estado}`);
        }
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  async generarReporteInventario(items: any[], campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(20).text('Reporte de Inventario', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-PE')}`);
      doc.moveDown(2);

      items.forEach((item, index) => {
        const isLow = item.stockFisico <= item.stockMinimo;
        const data: any = {
          producto: item.producto.nombre,
          categoria: item.producto.categoria.nombre,
          sku: item.producto.sku,
          stock: item.stockFisico,
          minimo: item.stockMinimo,
          estado: isLow ? 'BAJO STOCK' : 'OK'
        };
        const labels: any = { producto: 'Producto', categoria: 'Categoría', sku: 'SKU', stock: 'Stock', minimo: 'Mínimo', estado: 'Estado' };

        doc.fontSize(12).fillColor(isLow ? 'red' : 'black').text(`${item.producto.nombre}`);
        
        if (campos && campos.length > 0) {
          campos.forEach(campo => {
            if (campo !== 'producto' && data[campo] !== undefined) {
              doc.fontSize(10).fillColor('gray').text(`${labels[campo] || campo}: ${data[campo]}`);
            }
          });
        } else {
          doc.fontSize(10).fillColor('gray').text(`Stock: ${item.stockFisico} (Mín: ${item.stockMinimo}) | Categoría: ${item.producto.categoria.nombre} | SKU: ${item.producto.sku}`);
        }
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  async generarReporteClientes(clientes: any[], campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(20).text('Reporte de Clientes', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-PE')}`);
      doc.moveDown(2);

      clientes.forEach((cliente, index) => {
        const data: any = {
          nombre: `${cliente.nombre} ${cliente.apellido}`,
          correo: cliente.usuario.correo,
          dni: cliente.dni,
          ordenes: cliente._count.ordenes,
          registro: cliente.created_at.toLocaleString()
        };
        const labels: any = { nombre: 'Nombre', correo: 'Correo', dni: 'DNI', ordenes: 'Total Órdenes', registro: 'Registro' };

        doc.fontSize(12).fillColor('black').text(`${cliente.nombre} ${cliente.apellido}`);
        
        if (campos && campos.length > 0) {
          campos.forEach(campo => {
            if (campo !== 'nombre' && data[campo] !== undefined) {
              doc.fontSize(10).fillColor('gray').text(`${labels[campo] || campo}: ${data[campo]}`);
            }
          });
        } else {
          doc.fontSize(10).fillColor('gray').text(`Correo: ${cliente.usuario.correo} | DNI: ${cliente.dni} | Órdenes: ${cliente._count.ordenes}`);
        }
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  async generarReporteFinanciero(resumen: any, dto: any, campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(20).text('Reporte de Estados Financieros', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Periodo: ${dto.fechaInicio} al ${dto.fechaFin}`, { align: 'center' });
      doc.moveDown(2);

      const allItems = [
        { key: 'ingresos_brutos', label: 'Ingresos Brutos', value: resumen.ingresos_brutos, color: 'black' },
        { key: 'costo_mercancia_vendida', label: 'Costo de Mercancía Vendida', value: resumen.costo_mercancia_vendida, color: 'red' },
        { key: 'utilidad_bruta', label: 'Utilidad Bruta', value: resumen.utilidad_bruta, color: 'green' }
      ];

      allItems.forEach(item => {
        if (!campos || campos.length === 0 || campos.includes(item.key)) {
          doc.fontSize(14).fillColor(item.color as any).text(`${item.label}:`, { continued: true });
          doc.text(` S/ ${Number(item.value || 0).toFixed(2)}`, { align: 'right' });
          doc.moveDown();
        }
      });

      doc.end();
    });
  }

  async generarReporteMasVendidos(productos: any[], dto: any, campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(20).text('Productos Más Vendidos', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Periodo: ${dto.fechaInicio} al ${dto.fechaFin}`, { align: 'center' });
      doc.moveDown(2);

      productos.forEach((p, index) => {
        const data: any = {
          sku: p.sku,
          nombre: p.nombre,
          total_vendido: p.total_vendido,
          ingresos_generados: `S/ ${Number(p.ingresos_generados).toFixed(2)}`
        };
        const labels: any = { sku: 'SKU', nombre: 'Producto', total_vendido: 'Unidades', ingresos_generados: 'Ingresos' };

        doc.fontSize(12).fillColor('black').text(`${index + 1}. ${p.nombre}`);
        
        if (campos && campos.length > 0) {
          campos.forEach(campo => {
            if (campo !== 'nombre' && data[campo] !== undefined) {
              doc.fontSize(10).fillColor('gray').text(`${labels[campo] || campo}: ${data[campo]}`);
            }
          });
        } else {
          doc.fontSize(10).fillColor('gray').text(`SKU: ${p.sku} | Unidades: ${p.total_vendido} | Ingresos: ${data.ingresos_generados}`);
        }
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}
