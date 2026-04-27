import { z } from 'zod';

// Para GET /api/v1/reportes/operacional/ordenes (Query Params)
export const filtroReporteSchema = z.object({
  fechaInicio: z.string().default('2024-01-01'),
  fechaFin: z.string().default(new Date().toISOString()),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  campos: z.preprocess((val) => {
    if (typeof val === 'string') return val.split(',');
    return val;
  }, z.array(z.string())).optional(),
});

// Para descarga de reportes Puppeteer (Opcional)
export const descargaGestionSchema = z.object({
  periodo: z.enum(['mensual', 'trimestral', 'anual']).default('mensual'),
  anio: z.coerce.number().int().min(2020).max(2030).default(new Date().getFullYear()),
  mes: z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
});

export type FiltroReporteDto = z.infer<typeof filtroReporteSchema>;
export type DescargaGestionDto = z.infer<typeof descargaGestionSchema>;