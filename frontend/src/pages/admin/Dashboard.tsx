import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { VentasChart } from '@/components/charts/VentasChart';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Users,
  CalendarDays,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';

export default function Dashboard() {
  const [fechaInicio, setFechaInicio] = useState('2024-01-01');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-kpis', fechaInicio, fechaFin],
    queryFn: () => adminService.getDashboardKpis(fechaInicio, fechaFin),
    refetchInterval: 30000, // Refrescar cada 30 segundos para "tiempo real"
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
  const ordenesRecientes = dashboardData?.ordenesRecientes || [];
  const actividadReciente = dashboardData?.actividadReciente || [];
  const productosMasVendidos = dashboardData?.productosMasVendidos || [];
  const resumenFinanciero = dashboardData?.resumenFinanciero || { ingresos_brutos: 0, costo_mercancia_vendida: 0, utilidad_bruta: 0 };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, description, color = "primary" }: any) => (
    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 bg-card/50 backdrop-blur-sm transition-all hover:ring-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">{title}</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">{value}</CardTitle>
        </div>
        <div className={`h-10 w-10 rounded-lg bg-${color}/5 flex items-center justify-center`}>
          <Icon className={`h-5 w-5 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1.5 mt-1">
          {trendValue && (
            <span className={`flex items-center gap-0.5 text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{description}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <div className="flex h-full items-center justify-center">Cargando dashboard...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground font-medium">Resumen general del rendimiento de tu tienda en tiempo real.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
        <CardContent className="pt-6">
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
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Ingresos Totales" 
          value={`S/ ${Number(kpis?.ingresosTotales || resumenFinanciero.ingresos_brutos || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={DollarSign}
          description="Total ventas brutas"
          color="emerald-600"
        />
        <StatCard 
          title="Ticket Promedio" 
          value={`S/ ${Number(kpis?.ticketPromedio || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={TrendingUp}
          description="Promedio por orden"
          color="blue-600"
        />
        <StatCard 
          title="Órdenes Totales" 
          value={Number(kpis?.totalOrdenes || 0).toLocaleString()} 
          icon={CalendarDays}
          description="Periodo seleccionado"
          color="amber-500"
        />
        <StatCard 
          title="Clientes Totales" 
          value={Number(kpis?.totalClientes || 0).toLocaleString()} 
          icon={Users}
          description="Clientes registrados"
          color="rose-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Costo de Ventas</CardTitle>
              <CardDescription>Valor de mercancía vendida.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              S/ {Number(resumenFinanciero.costo_mercancia_vendida || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Utilidad Bruta</CardTitle>
              <CardDescription>Ganancia estimada del periodo.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              S/ {Number(resumenFinanciero.utilidad_bruta || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <StatCard 
          title="Stock Bajo" 
          value={Number(kpis?.productosBajoStock || 0).toLocaleString()} 
          icon={AlertTriangle}
          trend={Number(kpis?.productosBajoStock) > 0 ? "down" : "up"}
          description="requieren atención"
          color="amber-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Evolución de Ventas</CardTitle>
              <CardDescription>Ventas diarias en el periodo seleccionado.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full">
              <VentasChart data={ventasDiarias} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Ventas por Categoría</CardTitle>
            <CardDescription>Distribución del periodo seleccionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ventasCategoria.length > 0 ? (
                ventasCategoria.map((categoria: any) => (
                  <div key={categoria.categoria} className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold leading-none">{categoria.categoria}</p>
                      <p className="text-xs text-muted-foreground font-medium">{categoria.unidades_vendidas} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">S/ {Number(categoria.total_ventas).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin datos de categorías</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-7 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Productos Más Vendidos</CardTitle>
            <CardDescription>Top 5 productos por volumen.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {productosMasVendidos.length > 0 ? (
                productosMasVendidos.map((prod: any) => (
                  <div key={prod.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-muted flex items-center justify-center font-bold text-xs">
                        {prod.sku}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold leading-none truncate max-w-[150px]">{prod.nombre}</p>
                        <p className="text-xs text-muted-foreground font-medium">{Number(prod.total_vendido || 0)} unidades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">S/ {Number(prod.ingresos_generados || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin datos de ventas</p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-7 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Órdenes Recientes</CardTitle>
              <CardDescription>Últimas transacciones registradas en la plataforma.</CardDescription>
            </div>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ordenesRecientes.length > 0 ? (
                ordenesRecientes.map((orden: any) => (
                  <div key={orden.id} className="rounded-lg border border-border/40 bg-background/30 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold truncate">{orden.numeroOrden}</p>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {orden.estado?.nombre || 'Sin estado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {orden.cliente?.nombre} {orden.cliente?.apellido}
                    </p>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{new Date(orden.created_at).toLocaleDateString()}</span>
                      <span className="font-bold text-foreground">S/ {Number(orden.totalFinal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 col-span-full">No hay órdenes recientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-7 border-none shadow-sm ring-1 ring-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Actividad del Sistema</CardTitle>
              <CardDescription>Logs de auditoría en tiempo real.</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {actividadReciente.length > 0 ? (
                actividadReciente.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-background/30">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      log.accion === 'INSERT' ? 'bg-emerald-500' : 
                      log.accion === 'UPDATE' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{log.accion}</p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {new Date(log.fechaAccion).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-sm font-bold leading-tight">
                        {log.tablaAfectada.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        Por: {log.usuarioEjecutor?.correo || 'Sistema'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 col-span-full">No hay actividad reciente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}