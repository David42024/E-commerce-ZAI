import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';
import { ReporteService } from './services/reporte.service';

const app = express();

// 1. Seguridad básica (Headers) con CSP personalizada
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", config.clientUrl, "https://plankton-app-4r36s.ondigitalocean.app"],
      scriptSrc: ["'self'", ...(config.nodeEnv !== 'production' ? ["'unsafe-eval'"] : [])],
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Permitir imágenes del mismo origen, data URIs y localhost (dev cross-origin)
      imgSrc: ["'self'", 'data:', 'blob:', 'http://localhost:*', config.clientUrl],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    }
  }
}));

// 2. CORS
app.use(cors({ origin: config.clientUrl, credentials: true }));

// 3. Parseo de JSON (DEBE ir antes de las rutas)
app.use(express.json({ limit: '10mb' }));

// 4. Documentación Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'E-Commerce API', version: '1.0.0', description: 'API para sistema E-Commerce' },
  },
  apis: ['./src/routes/*.ts'], // Escanea JSDoc
});
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 5. Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 6. Archivos estáticos para subidas
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const reporteService = new ReporteService();

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

app.get('/internal/reportes/ventas-gestion', async (req, res, next) => {
  try {
    const fechaInicio = typeof req.query.fechaInicio === 'string'
      ? req.query.fechaInicio
      : '2024-01-01';
    const fechaFin = typeof req.query.fechaFin === 'string'
      ? req.query.fechaFin
      : new Date().toISOString();

    const data = await reporteService.getDatosDashboard({
      fechaInicio,
      fechaFin,
      search: '',
      campos: undefined
    } as any);

    const ventasDiarias = Array.isArray(data.ventasDiarias) ? data.ventasDiarias : [];
    const ventasCategoria = Array.isArray(data.ventasCategoria) ? data.ventasCategoria : [];
    const productosMasVendidos = Array.isArray(data.productosMasVendidos) ? data.productosMasVendidos : [];

    const html = `<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reporte de Gestión</title>
          <style>
            :root { color-scheme: light; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
              background: #f8fafc;
            }
            .sheet {
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              padding: 28px;
            }
            .header { margin-bottom: 24px; }
            .eyebrow { text-transform: uppercase; letter-spacing: .18em; font-size: 11px; color: #64748b; }
            h1 { margin: 6px 0 8px; font-size: 28px; }
            .sub { color: #475569; font-size: 13px; }
            .kpis {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
              margin: 24px 0;
            }
            .kpi {
              padding: 14px;
              border-radius: 16px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
            }
            .kpi .label { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: #64748b; }
            .kpi .value { margin-top: 8px; font-size: 22px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
            .panel {
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              padding: 16px;
              background: #fff;
            }
            .panel h2 { margin: 0 0 14px; font-size: 16px; }
            .recharts-wrapper { width: 100%; }
            .bars { display: grid; gap: 10px; }
            .bar-row { display: grid; grid-template-columns: 120px 1fr 70px; gap: 10px; align-items: center; }
            .bar-track { height: 12px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
            .bar-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #14b8a6); border-radius: 999px; }
            .table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .table th, .table td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: left; }
            .muted { color: #64748b; }
            .footer { margin-top: 18px; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div class="eyebrow">Análisis de Gestión</div>
              <h1>Reporte de Ventas y Desempeño</h1>
              <div class="sub">Periodo ${escapeHtml(fechaInicio)} al ${escapeHtml(fechaFin)}</div>
            </div>

            <div class="kpis">
              <div class="kpi"><div class="label">Ingresos Totales</div><div class="value">S/ ${Number((data.kpis as any)?.ingresosTotales || 0).toFixed(2)}</div></div>
              <div class="kpi"><div class="label">Ticket Promedio</div><div class="value">S/ ${Number((data.kpis as any)?.ticketPromedio || 0).toFixed(2)}</div></div>
              <div class="kpi"><div class="label">Órdenes</div><div class="value">${Number((data.kpis as any)?.totalOrdenes || 0)}</div></div>
              <div class="kpi"><div class="label">Clientes</div><div class="value">${Number((data.kpis as any)?.totalClientes || 0)}</div></div>
            </div>

            <div class="grid">
              <section class="panel">
                <h2>Ventas Diarias</h2>
                <div class="recharts-wrapper">
                  <div class="bars">
                    ${ventasDiarias.slice(0, 12).map((item: any) => {
                      const value = Number(item.ventas_totales || 0);
                      const max = Math.max(...ventasDiarias.map((entry: any) => Number(entry.ventas_totales || 0)), 1);
                      const width = Math.max((value / max) * 100, 4);
                      return `<div class="bar-row"><span class="muted">${escapeHtml(item.fecha)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong>S/ ${value.toFixed(2)}</strong></div>`;
                    }).join('')}
                  </div>
                </div>
              </section>

              <section class="panel">
                <h2>Resumen</h2>
                <table class="table">
                  <thead><tr><th>Categoría</th><th>Ventas</th></tr></thead>
                  <tbody>
                    ${ventasCategoria.slice(0, 6).map((item: any) => `<tr><td>${escapeHtml(item.categoria)}</td><td>S/ ${Number(item.total_ventas || 0).toFixed(2)}</td></tr>`).join('')}
                  </tbody>
                </table>
                <div style="height: 16px"></div>
                <table class="table">
                  <thead><tr><th>Producto</th><th>Unidades</th></tr></thead>
                  <tbody>
                    ${productosMasVendidos.slice(0, 6).map((item: any) => `<tr><td>${escapeHtml(item.nombre)}</td><td>${Number(item.total_vendido || 0)}</td></tr>`).join('')}
                  </tbody>
                </table>
              </section>
            </div>

            <div class="footer">Generado automáticamente por el sistema de reportes.</div>
          </div>
        </body>
      </html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
});

// 6. Rutas principales (Agregador central)
app.use('/api/v1', routes);

// 7. Frontend estático + fallback SPA (solo rutas no API)
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 8. Manejo de errores (DEBE ser el último middleware)
app.use(errorHandler);

export { app };
export default app;