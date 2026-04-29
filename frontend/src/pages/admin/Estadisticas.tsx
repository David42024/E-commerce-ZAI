import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { VentasChart } from '@/components/charts/VentasChart';
import { VentasPorCategoriaChart } from '@/components/charts/VentasPorCategoriaChart';
import { ABCAnalysisChart } from '@/components/charts/ABCAnalysisChart';
import { RFMChart } from '@/components/charts/RFMChart';
import { CohortChart } from '@/components/charts/CohortChart';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { useState } from 'react';
import { 
  TrendingUp, 
  BarChart, 
  PieChart as PieChartIcon, 
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Target,
  Layers,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Estadisticas() {
  const [fechaInicio, setFechaInicio] = useState('2024-01-01');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats', fechaInicio, fechaFin],
    queryFn: () => adminService.getDashboardKpis(fechaInicio, fechaFin),
  });

  const dashboardData = (data as any)?.data ?? data ?? {};
  const kpis = dashboardData?.kpis;
  const ventasDiarias = (dashboardData?.ventasDiarias || []).map((item: any) => ({
    ...item,
    ventas_totales: Number(item.ventas_totales || 0),
  }));
  const ventasCategoria = (dashboardData?.ventasCategoria || []).map((item: any) => ({
    ...item,
    total_ventas: Number(item.total_ventas || 0),
    unidades_vendidas: Number(item.unidades_vendidas || 0),
  }));
  const productosMasVendidos = dashboardData?.productosMasVendidos || [];
  const resumenFinanciero = dashboardData?.resumenFinanciero || { ingresos_brutos: 0, costo_mercancia_vendida: 0, utilidad_bruta: 0 };
  const rfmData = dashboardData?.rfm || [];
  const cohortData = dashboardData?.cohortes || [];

  // Cálculos para Insights Dinámicos
  const sortedByRevenue = [...productosMasVendidos].sort((a, b) => b.ingresos_generados - a.ingresos_generados);
  const totalRev = sortedByRevenue.reduce((acc, curr) => acc + Number(curr.ingresos_generados), 0);
  let accRev = 0;
  let productsFor80 = 0;
  sortedByRevenue.forEach(p => {
    if (accRev < totalRev * 0.8) {
      accRev += Number(p.ingresos_generados);
      productsFor80++;
    }
  });
  const paretoPercentage = productosMasVendidos.length > 0 
    ? (productsFor80 / productosMasVendidos.length) * 100 
    : 20;

  const avgRetention = cohortData.length > 0
    ? (cohortData.filter((c: any) => c.month_number === 1).reduce((acc: number, curr: any) => acc + Number(curr.retention_rate), 0) / 
       cohortData.filter((c: any) => c.month_number === 1).length || 15)
    : 15;

  const topCustomers = rfmData.filter((c: any) => c.total_score >= 12).length;
  const topCustomersPerc = rfmData.length > 0 ? (topCustomers / rfmData.length) * 100 : 0;

  const marginPercentage = resumenFinanciero.ingresos_brutos > 0 
    ? (resumenFinanciero.utilidad_bruta / resumenFinanciero.ingresos_brutos) * 100 
    : 0;

  if (isLoading) return <div className="flex h-full items-center justify-center">Cargando análisis...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Gestión (BI)</h1>
          <p className="text-muted-foreground font-medium">Inteligencia de negocios para decisiones estratégicas.</p>
        </div>
      </div>

      <Tabs defaultValue="operacional" className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList className="bg-muted/50 p-1 border border-border/50">
            <TabsTrigger value="operacional" className="gap-2 font-bold data-[state=active]:bg-background">
              <BarChart className="h-4 w-4" /> Operacional
            </TabsTrigger>
            <TabsTrigger value="estrategico" className="gap-2 font-bold data-[state=active]:bg-background">
              <Target className="h-4 w-4" /> Estratégico
            </TabsTrigger>
          </TabsList>

          <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 w-full sm:w-auto">
            <CardContent className="p-1 px-3">
              <DateRangeFilter 
                fechaInicio={fechaInicio} 
                fechaFin={fechaFin} 
                onChange={(inicio, fin) => {
                  setFechaInicio(inicio);
                  setFechaFin(fin);
                }} 
              />
            </CardContent>
          </Card>
        </div>

        <TabsContent value="operacional" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* KPIs Estratégicos */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                <DollarSign className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Margen de Utilidad</CardDescription>
                <CardTitle className="text-2xl font-black text-emerald-600">
                  {marginPercentage.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${Math.min(marginPercentage, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Ticket Promedio</CardDescription>
                <CardTitle className="text-2xl font-black text-blue-600">
                  S/ {Number(kpis?.ticketPromedio || 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Valor por transacción</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                <Users className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Total Clientes</CardDescription>
                <CardTitle className="text-2xl font-black text-amber-500">
                  {kpis?.totalClientes || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Base de datos activa</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                <Package className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Stock Crítico</CardDescription>
                <CardTitle className="text-2xl font-black text-rose-600">
                  {kpis?.productosBajoStock || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Productos por reponer</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-7">
            {/* Gráfico de Tendencia */}
            <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">Tendencia de Ingresos</CardTitle>
                </div>
                <CardDescription>Análisis temporal de ventas brutas.</CardDescription>
              </CardHeader>
              <CardContent>
                <VentasChart data={ventasDiarias} />
              </CardContent>
            </Card>

            {/* Gráfico de Categorías */}
            <Card className="lg:col-span-3 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-bold">Mix de Ventas</CardTitle>
                </div>
                <CardDescription>Participación por categoría.</CardDescription>
              </CardHeader>
              <CardContent>
                <VentasPorCategoriaChart data={ventasCategoria} />
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Ranking Estratégico */}
          <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-bold">Ranking de Productos (Top Impacto)</CardTitle>
              </div>
              <CardDescription>Productos con mayor contribución al ingreso total.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="text-left py-3 font-bold uppercase tracking-wider text-[10px]">Producto</th>
                      <th className="text-center py-3 font-bold uppercase tracking-wider text-[10px]">Unidades</th>
                      <th className="text-right py-3 font-bold uppercase tracking-wider text-[10px]">Ingresos</th>
                      <th className="text-right py-3 font-bold uppercase tracking-wider text-[10px]">Contribución</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {productosMasVendidos.map((prod: any) => {
                      const contribucion = resumenFinanciero.ingresos_brutos > 0 
                        ? (prod.ingresos_generados / resumenFinanciero.ingresos_brutos) * 100 
                        : 0;
                      return (
                        <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="font-bold">{prod.nombre}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{prod.sku}</span>
                            </div>
                          </td>
                          <td className="text-center py-4 font-medium">{prod.total_vendido}</td>
                          <td className="text-right py-4 font-bold">S/ {Number(prod.ingresos_generados).toFixed(2)}</td>
                          <td className="text-right py-4">
                            <Badge variant="secondary" className="font-bold">
                              {contribucion.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estrategico" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Análisis ABC */}
            <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-lg font-bold">Análisis ABC de Inventario</CardTitle>
                </div>
                <CardDescription>Clasificación de productos por su valor económico (Pareto 80/20).</CardDescription>
              </CardHeader>
              <CardContent>
                <ABCAnalysisChart data={productosMasVendidos} />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Clase A</p>
                    <p className="text-xs text-muted-foreground">Top 80% ingresos. Prioridad máxima.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] font-bold text-amber-600 uppercase">Clase B</p>
                    <p className="text-xs text-muted-foreground">Siguiente 15%. Control regular.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <p className="text-[10px] font-bold text-rose-600 uppercase">Clase C</p>
                    <p className="text-xs text-muted-foreground">Resto 5%. Control simplificado.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Segmentación RFM */}
            <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg font-bold">Segmentación RFM</CardTitle>
                </div>
                <CardDescription>Recencia, Frecuencia y Valor Monetario por cliente.</CardDescription>
              </CardHeader>
              <CardContent>
                <RFMChart data={rfmData} />
                <p className="mt-2 text-[10px] text-muted-foreground text-center font-medium italic">
                  Las burbujas más grandes representan clientes con mayor valor monetario.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-7">
            {/* Análisis de Cohortes */}
            <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-lg font-bold">Retención por Cohortes</CardTitle>
                </div>
                <CardDescription>Análisis de fidelidad y recompra mensual.</CardDescription>
              </CardHeader>
              <CardContent>
                <CohortChart data={cohortData} />
              </CardContent>
            </Card>

            {/* Resumen de Hallazgos */}
            <Card className="lg:col-span-3 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Insights Estratégicos</CardTitle>
                <CardDescription>Observaciones clave del periodo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Concentración de Ingresos</p>
                    <p className="text-xs text-muted-foreground">El {paretoPercentage.toFixed(0)}% de tus productos generan el 80% de los ingresos totales (Ley de Pareto).</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1 h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Users className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Fidelización y Retención</p>
                    <p className="text-xs text-muted-foreground">La tasa de retención promedio al segundo mes es del {avgRetention.toFixed(1)}%. {avgRetention < 20 ? 'Se recomienda fortalecer campañas de CRM.' : 'Buen nivel de lealtad.'}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="mt-1 h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Target className="h-3 w-3 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Segmentación de Valor</p>
                    <p className="text-xs text-muted-foreground">El {topCustomersPerc.toFixed(1)}% de tus clientes son "Campeones" o "Leales" según el score RFM. Enfoca tus beneficios en ellos.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
