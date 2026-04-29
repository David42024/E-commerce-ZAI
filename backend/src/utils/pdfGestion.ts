import PDFDocument from 'pdfkit';

// ─── Design tokens (same as pdfGenerator.ts) ──────────────────────────────────
const BRAND  = '#1e3a5f';
const ACCENT = '#2563eb';
const SUCCESS = '#16a34a';
const DANGER  = '#dc2626';
const MUTED   = '#64748b';
const BG_ROW  = '#f1f5f9';
const WHITE   = '#ffffff';
const BLACK   = '#0f172a';
const PAGE_W  = 595.28;
const PAGE_H  = 841.89;
const MARGIN  = 48;
const COL_W   = PAGE_W - MARGIN * 2;

function fmt(v: unknown, decimals = 2) {
  const n = Number(v ?? 0);
  return isNaN(n) ? '—' : n.toFixed(decimals);
}
function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return String(d); }
}

function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.rect(0, 0, PAGE_W, 72).fill(BRAND);
  doc.fontSize(11).fillColor(WHITE).font('Helvetica-Bold')
     .text('E-COMMERCE', MARGIN, 16, { continued: true })
     .font('Helvetica').fillColor('#93c5fd').text(' · Sistema de Gestión');
  doc.fontSize(20).fillColor(WHITE).font('Helvetica-Bold').text(title, MARGIN, 34);
  doc.rect(MARGIN, 68, COL_W, 3).fill(ACCENT);
  doc.fontSize(9).fillColor(MUTED).font('Helvetica').text(subtitle, MARGIN, 80);
  const now = new Date().toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });
  doc.fontSize(8).fillColor(MUTED).text(`Generado: ${now}`, MARGIN, 80, { align: 'right', width: COL_W });
  doc.moveDown(3.5);
}

function drawPageFooter(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.rect(0, PAGE_H - 36, PAGE_W, 36).fill(BG_ROW);
    doc.fontSize(8).fillColor(MUTED).font('Helvetica')
       .text('Documento confidencial — uso interno', MARGIN, PAGE_H - 22)
       .text(`Página ${i + 1} de ${range.count}`, MARGIN, PAGE_H - 22, { align: 'right', width: COL_W });
  }
}

interface ColDef { label: string; width: number; align?: 'left' | 'right' | 'center' }

function drawTable(doc: PDFKit.PDFDocument, cols: ColDef[], rows: (string | number)[][]) {
  const y0 = doc.y;
  const rowH = 20;
  const headerH = 22;

  let x = MARGIN;
  doc.rect(MARGIN, y0, COL_W, headerH).fill(BRAND);
  doc.fontSize(8).fillColor(WHITE).font('Helvetica-Bold');
  cols.forEach(col => {
    doc.text(col.label, x + 4, y0 + 7, { width: col.width - 8, align: col.align ?? 'left' });
    x += col.width;
  });

  let currentY = y0 + headerH;
  rows.forEach((row, ri) => {
    if (currentY + rowH > PAGE_H - 60) {
      doc.addPage();
      currentY = MARGIN + 10;
    }
    const bg = ri % 2 === 1 ? BG_ROW : WHITE;
    doc.rect(MARGIN, currentY, COL_W, rowH).fill(bg);
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

function drawBarChart(doc: PDFKit.PDFDocument, title: string, items: { label: string; value: number }[], color = ACCENT) {
  if (!items.length) return;
  sectionTitle(doc, title);
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const barMaxW = COL_W - 150;
  const barH = 14;
  const gap = 6;
  items.slice(0, 12).forEach(item => {
    if (doc.y + barH + gap > PAGE_H - 60) { doc.addPage(); }
    const barW = Math.max((item.value / maxVal) * barMaxW, 4);
    const y = doc.y;
    doc.fontSize(8).fillColor(MUTED).font('Helvetica')
       .text(String(item.label).slice(0, 18), MARGIN, y + 3, { width: 100, lineBreak: false });
    doc.rect(MARGIN + 105, y, barW, barH).fill(color);
    doc.fontSize(7.5).fillColor(BLACK).font('Helvetica-Bold')
       .text(`S/ ${fmt(item.value)}`, MARGIN + 105 + barW + 6, y + 3, { lineBreak: false });
    doc.y = y + barH + gap;
  });
  doc.moveDown(0.5);
}

/**
 * Generates the "Análisis de Gestión" PDF using PDFKit (no Chrome/Puppeteer required).
 * Accepts the same dashboard data object returned by ReporteService.getDatosDashboard().
 */
export class PdfGestion {
  static async generarPdf(data: {
    kpis: any;
    ventasDiarias: any[];
    ventasCategoria: any[];
    productosMasVendidos: any[];
    resumenFinanciero: any;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true, autoFirstPage: true });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const periodo = data.fechaInicio && data.fechaFin
        ? `Período: ${fmtDate(data.fechaInicio)} al ${fmtDate(data.fechaFin)}`
        : `Generado el ${fmtDate(new Date())}`;

      drawHeader(doc, 'Análisis de Gestión de Ventas', periodo);

      // ── KPIs principales
      const kpis = data.kpis as any || {};
      drawKpiBlock(doc, [
        { label: 'Ingresos Totales',  value: `S/ ${fmt(kpis.ingresosTotales   ?? kpis.total_ingresos ?? 0)}`, color: SUCCESS },
        { label: 'Ticket Promedio',   value: `S/ ${fmt(kpis.ticketPromedio    ?? kpis.ticket_promedio ?? 0)}`, color: ACCENT  },
        { label: 'Total Órdenes',     value: String(kpis.totalOrdenes         ?? kpis.total_ordenes ?? 0) },
        { label: 'Total Clientes',    value: String(kpis.totalClientes         ?? kpis.total_clientes ?? 0) },
      ]);

      // ── Ventas diarias (bar chart)
      const ventasDiarias = (data.ventasDiarias || []).map((item: any) => ({
        label: String(item.fecha ?? item.date ?? ''),
        value: Number(item.ventas_totales ?? item.total ?? 0),
      }));
      drawBarChart(doc, 'Ventas Diarias', ventasDiarias, ACCENT);

      // ── Ventas por categoría (bar chart)
      const ventasCategoria = (data.ventasCategoria || []).map((item: any) => ({
        label: String(item.categoria ?? item.category ?? ''),
        value: Number(item.total_ventas ?? item.total ?? 0),
      }));
      drawBarChart(doc, 'Ventas por Categoría', ventasCategoria, SUCCESS);

      // ── Resumen financiero
      const fin = data.resumenFinanciero as any || {};
      const ingresos = Number(fin.ingresos_brutos ?? 0);
      const costos   = Number(fin.costo_mercancia_vendida ?? 0);
      const utilidad = Number(fin.utilidad_bruta ?? 0);
      const margen   = ingresos > 0 ? ((utilidad / ingresos) * 100).toFixed(1) : '0.0';

      sectionTitle(doc, 'Resumen Financiero');
      drawTable(doc, [
        { label: 'Concepto', width: 280 },
        { label: 'Monto (S/)', width: COL_W - 280, align: 'right' },
      ], [
        ['Ingresos Brutos',           `S/ ${fmt(ingresos)}`],
        ['(-) Costo de Mercancía',    `S/ ${fmt(costos)}`],
        ['= Utilidad Bruta',          `S/ ${fmt(utilidad)}`],
        ['Margen Bruto',              `${margen}%`],
      ]);

      // ── Productos más vendidos
      const productos = (data.productosMasVendidos || []).slice(0, 15);
      if (productos.length > 0) {
        sectionTitle(doc, 'Top Productos Más Vendidos');
        drawTable(doc, [
          { label: '#',        width: 28,  align: 'center' },
          { label: 'Producto', width: 200 },
          { label: 'SKU',      width: 80  },
          { label: 'Unidades', width: 70,  align: 'right' },
          { label: 'Ingresos', width: COL_W - 378, align: 'right' },
        ], productos.map((p: any, i: number) => [
          i + 1,
          p.nombre ?? '—',
          p.sku ?? '—',
          p.total_vendido ?? 0,
          `S/ ${fmt(p.ingresos_generados ?? 0)}`,
        ]));
      }

      drawPageFooter(doc);
      doc.end();
    });
  }
}