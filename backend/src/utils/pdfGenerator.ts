import PDFDocument from 'pdfkit';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND   = '#1e3a5f';   // azul oscuro corporativo
const ACCENT  = '#2563eb';   // azul primario
const SUCCESS = '#16a34a';   // verde
const DANGER  = '#dc2626';   // rojo
const MUTED   = '#64748b';   // gris medio
const BG_ROW  = '#f1f5f9';   // fondo filas alternas
const WHITE   = '#ffffff';
const BLACK   = '#0f172a';
const PAGE_W  = 595.28;      // A4 en puntos
const PAGE_H  = 841.89;
const MARGIN  = 48;
const COL_W   = PAGE_W - MARGIN * 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: unknown, decimals = 2) {
  const n = Number(v ?? 0);
  return isNaN(n) ? '—' : n.toFixed(decimals);
}
function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return String(d); }
}

// ─── Shared page elements ─────────────────────────────────────────────────────
function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  // Franja superior con color corporativo
  doc.rect(0, 0, PAGE_W, 72).fill(BRAND);

  // Logo textual
  doc.fontSize(11).fillColor(WHITE).font('Helvetica-Bold')
     .text('E-COMMERCE', MARGIN, 16, { continued: true })
     .font('Helvetica').fillColor('#93c5fd').text(' · Sistema de Gestión');

  // Título del reporte
  doc.fontSize(20).fillColor(WHITE).font('Helvetica-Bold')
     .text(title, MARGIN, 34);

  // Línea decorativa
  doc.rect(MARGIN, 68, COL_W, 3).fill(ACCENT);

  // Subtítulo / período
  doc.fontSize(9).fillColor(MUTED).font('Helvetica')
     .text(subtitle, MARGIN, 80);

  // Timestamp generación
  const now = new Date().toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });
  doc.fontSize(8).fillColor(MUTED)
     .text(`Generado: ${now}`, MARGIN, 80, { align: 'right', width: COL_W });

  doc.moveDown(3.5);
}

function drawPageFooter(doc: PDFKit.PDFDocument) {
  const pages = (doc as any).bufferedPageRange?.()?.count ?? 1;
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.rect(0, PAGE_H - 36, PAGE_W, 36).fill(BG_ROW);
    doc.fontSize(8).fillColor(MUTED).font('Helvetica')
       .text('Documento confidencial — uso interno', MARGIN, PAGE_H - 22)
       .text(`Página ${i + 1} de ${range.count}`, MARGIN, PAGE_H - 22, { align: 'right', width: COL_W });
  }
}

// ─── Table engine ─────────────────────────────────────────────────────────────
interface ColDef { label: string; width: number; align?: 'left' | 'right' | 'center' }

function drawTable(
  doc: PDFKit.PDFDocument,
  cols: ColDef[],
  rows: (string | number)[][],
  startY?: number
) {
  const y0 = startY ?? doc.y;
  const rowH = 20;
  const headerH = 22;

  // ── Header row
  let x = MARGIN;
  doc.rect(MARGIN, y0, COL_W, headerH).fill(BRAND);
  doc.fontSize(8).fillColor(WHITE).font('Helvetica-Bold');
  cols.forEach(col => {
    doc.text(col.label, x + 4, y0 + 7, { width: col.width - 8, align: col.align ?? 'left' });
    x += col.width;
  });

  // ── Data rows
  let currentY = y0 + headerH;
  rows.forEach((row, ri) => {
    // Auto-page break
    if (currentY + rowH > PAGE_H - 60) {
      doc.addPage();
      currentY = MARGIN + 10;
    }

    const bg = ri % 2 === 1 ? BG_ROW : WHITE;
    doc.rect(MARGIN, currentY, COL_W, rowH).fill(bg);

    // Bottom border
    doc.moveTo(MARGIN, currentY + rowH).lineTo(MARGIN + COL_W, currentY + rowH)
       .strokeColor('#e2e8f0').lineWidth(0.5).stroke();

    let cx = MARGIN;
    doc.fontSize(8).font('Helvetica').fillColor(BLACK);
    row.forEach((cell, ci) => {
      doc.text(String(cell ?? '—'), cx + 4, currentY + 6,
        { width: cols[ci].width - 8, align: cols[ci].align ?? 'left', lineBreak: false });
      cx += cols[ci].width;
    });
    currentY += rowH;
  });

  doc.y = currentY + 8;
}

// ─── KPI block ────────────────────────────────────────────────────────────────
function drawKpiBlock(doc: PDFKit.PDFDocument, kpis: { label: string; value: string; color?: string }[]) {
  const kpiW = COL_W / kpis.length;
  const startY = doc.y;
  const kpiH = 52;

  kpis.forEach((kpi, i) => {
    const kx = MARGIN + i * kpiW;
    doc.rect(kx, startY, kpiW - 6, kpiH).fill(BG_ROW).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.rect(kx, startY, 3, kpiH).fill(kpi.color || ACCENT);
    doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
       .text(kpi.label.toUpperCase(), kx + 10, startY + 8, { width: kpiW - 20 });
    doc.fontSize(16).fillColor(kpi.color || BRAND).font('Helvetica-Bold')
       .text(kpi.value, kx + 10, startY + 22, { width: kpiW - 20 });
  });

  doc.y = startY + kpiH + 16;
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.5);
  doc.rect(MARGIN, doc.y, COL_W, 1).fill(ACCENT);
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor(BRAND).font('Helvetica-Bold').text(text, MARGIN);
  doc.moveDown(0.5);
}

// ─── Public generators ────────────────────────────────────────────────────────
export class PdfGenerator {

  async generarReporteOrdenes(ordenes: any[], _campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true, autoFirstPage: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      drawHeader(doc, 'Reporte de Órdenes', 'Listado operacional de pedidos');

      // KPIs resumen
      const totalMonto = ordenes.reduce((s, o) => s + Number(o.totalFinal ?? 0), 0);
      const pagadas   = ordenes.filter(o => o.estado?.nombre === 'PAGADA').length;
      const pendientes = ordenes.filter(o => o.estado?.nombre === 'PENDIENTE').length;
      drawKpiBlock(doc, [
        { label: 'Total Órdenes', value: String(ordenes.length) },
        { label: 'Monto Total', value: `S/ ${fmt(totalMonto)}`, color: SUCCESS },
        { label: 'Pagadas', value: String(pagadas), color: SUCCESS },
        { label: 'Pendientes', value: String(pendientes), color: ACCENT },
      ]);

      sectionTitle(doc, 'Detalle de Órdenes');

      const cols: ColDef[] = [
        { label: '#',           width: 28, align: 'center' },
        { label: 'ID / Código', width: 105 },
        { label: 'Cliente',     width: 120 },
        { label: 'Estado',      width: 72 },
        { label: 'Fecha',       width: 80 },
        { label: 'Total (S/)',  width: 90, align: 'right' },
      ];

      const rows = ordenes.map((o, i) => [
        i + 1,
        o.codigo_seguimiento || o.id?.slice(0, 12) || '—',
        `${o.cliente?.nombre ?? ''} ${o.cliente?.apellido ?? ''}`.trim() || '—',
        o.estado?.nombre ?? '—',
        fmtDate(o.created_at),
        fmt(o.totalFinal),
      ]);

      drawTable(doc, cols, rows);
      drawPageFooter(doc);
      doc.end();
    });
  }

  async generarReporteInventario(items: any[], _campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true, autoFirstPage: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      drawHeader(doc, 'Reporte de Inventario', 'Estado actual del stock por producto');

      // KPIs
      const totalItems = items.length;
      const bajoStock  = items.filter(i => i.stockFisico <= i.stockMinimo).length;
      const agotados   = items.filter(i => i.stockFisico === 0).length;
      drawKpiBlock(doc, [
        { label: 'Productos',    value: String(totalItems) },
        { label: 'Bajo Stock',   value: String(bajoStock),  color: '#d97706' },
        { label: 'Agotados',     value: String(agotados),   color: DANGER },
        { label: 'OK',           value: String(totalItems - bajoStock), color: SUCCESS },
      ]);

      sectionTitle(doc, 'Detalle de Stock');

      const cols: ColDef[] = [
        { label: '#',         width: 28,  align: 'center' },
        { label: 'Producto',  width: 150 },
        { label: 'Categoría', width: 90  },
        { label: 'SKU',       width: 70  },
        { label: 'Físico',    width: 52,  align: 'right' },
        { label: 'Reservado', width: 60,  align: 'right' },
        { label: 'Mínimo',    width: 52,  align: 'right' },
        { label: 'Estado',    width: 45,  align: 'center' },
      ];

      const rows = items.map((item, i) => {
        const isLow = item.stockFisico <= item.stockMinimo;
        return [
          i + 1,
          item.producto?.nombre ?? '—',
          item.producto?.categoria?.nombre ?? '—',
          item.producto?.sku ?? '—',
          item.stockFisico ?? 0,
          item.stockReservado ?? 0,
          item.stockMinimo ?? 0,
          isLow ? '⚠ BAJO' : 'OK',
        ];
      });

      drawTable(doc, cols, rows);
      drawPageFooter(doc);
      doc.end();
    });
  }

  async generarReporteClientes(clientes: any[], _campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true, autoFirstPage: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      drawHeader(doc, 'Reporte de Clientes', 'Registro de clientes y actividad');

      drawKpiBlock(doc, [
        { label: 'Total Clientes', value: String(clientes.length) },
        { label: 'Con Órdenes',    value: String(clientes.filter(c => c._count?.ordenes > 0).length), color: SUCCESS },
        { label: 'Sin Órdenes',    value: String(clientes.filter(c => c._count?.ordenes === 0).length), color: MUTED },
        { label: 'Más Activo',     value: String(Math.max(0, ...clientes.map(c => c._count?.ordenes ?? 0))) + ' ord.' },
      ]);

      sectionTitle(doc, 'Listado de Clientes');

      const cols: ColDef[] = [
        { label: '#',          width: 28,  align: 'center' },
        { label: 'Nombre',     width: 130 },
        { label: 'Correo',     width: 150 },
        { label: 'DNI',        width: 60  },
        { label: 'Órdenes',   width: 55,  align: 'center' },
        { label: 'Registro',   width: 82  },
      ];

      const rows = clientes.map((c, i) => [
        i + 1,
        `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim(),
        c.usuario?.correo ?? '—',
        c.dni ?? '—',
        c._count?.ordenes ?? 0,
        fmtDate(c.created_at),
      ]);

      drawTable(doc, cols, rows);
      drawPageFooter(doc);
      doc.end();
    });
  }

  async generarReporteFinanciero(resumen: any, dto: any, _campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true, autoFirstPage: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      drawHeader(doc, 'Reporte Financiero',
        `Período: ${fmtDate(dto.fechaInicio)} al ${fmtDate(dto.fechaFin)}`);

      const ingresos = Number(resumen.ingresos_brutos ?? 0);
      const costos   = Number(resumen.costo_mercancia_vendida ?? 0);
      const utilidad = Number(resumen.utilidad_bruta ?? 0);
      const margen   = ingresos > 0 ? ((utilidad / ingresos) * 100).toFixed(1) : '0.0';

      drawKpiBlock(doc, [
        { label: 'Ingresos Brutos',  value: `S/ ${fmt(ingresos)}`,  color: SUCCESS },
        { label: 'CMV',              value: `S/ ${fmt(costos)}`,    color: DANGER  },
        { label: 'Utilidad Bruta',   value: `S/ ${fmt(utilidad)}`,  color: utilidad >= 0 ? SUCCESS : DANGER },
        { label: 'Margen Bruto',     value: `${margen}%`,           color: ACCENT  },
      ]);

      sectionTitle(doc, 'Estado de Resultados');

      const cols: ColDef[] = [
        { label: 'Concepto',    width: 280 },
        { label: 'Monto (S/)', width: COL_W - 280, align: 'right' },
      ];
      const rows: (string | number)[][] = [
        ['Ingresos Brutos (ventas confirmadas)',   `S/ ${fmt(ingresos)}`],
        ['(-) Costo de Mercancía Vendida (CMV)',   `S/ ${fmt(costos)}`],
        ['= Utilidad Bruta',                       `S/ ${fmt(utilidad)}`],
        ['Margen Bruto',                           `${margen}%`],
      ];

      drawTable(doc, cols, rows);
      drawPageFooter(doc);
      doc.end();
    });
  }

  async generarReporteMasVendidos(productos: any[], dto: any, _campos?: string[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true, autoFirstPage: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      drawHeader(doc, 'Productos Más Vendidos',
        `Período: ${fmtDate(dto.fechaInicio)} al ${fmtDate(dto.fechaFin)}`);

      const totalUnidades = productos.reduce((s, p) => s + Number(p.total_vendido ?? 0), 0);
      const totalIngresos = productos.reduce((s, p) => s + Number(p.ingresos_generados ?? 0), 0);

      drawKpiBlock(doc, [
        { label: 'Productos Distintos', value: String(productos.length) },
        { label: 'Unidades Totales',    value: String(totalUnidades), color: ACCENT },
        { label: 'Ingresos Generados',  value: `S/ ${fmt(totalIngresos)}`, color: SUCCESS },
        { label: 'Ticket Prom./Prod.',  value: productos.length > 0 ? `S/ ${fmt(totalIngresos / productos.length)}` : '—' },
      ]);

      sectionTitle(doc, 'Ranking de Productos');

      const cols: ColDef[] = [
        { label: '#',           width: 28,  align: 'center' },
        { label: 'Producto',    width: 175 },
        { label: 'SKU',         width: 80  },
        { label: 'Unidades',    width: 65,  align: 'right' },
        { label: 'Ingresos',    width: 90,  align: 'right' },
        { label: '% Ingr.',     width: 57,  align: 'right' },
      ];

      const rows = productos.map((p, i) => {
        const pct = totalIngresos > 0 ? ((Number(p.ingresos_generados ?? 0) / totalIngresos) * 100).toFixed(1) : '0.0';
        return [
          i + 1,
          p.nombre ?? '—',
          p.sku ?? '—',
          p.total_vendido ?? 0,
          `S/ ${fmt(p.ingresos_generados)}`,
          `${pct}%`,
        ];
      });

      drawTable(doc, cols, rows);
      drawPageFooter(doc);
      doc.end();
    });
  }
}
