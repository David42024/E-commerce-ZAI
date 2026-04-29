import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import {
  Search,
  History,
  Database,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  Info,
} from 'lucide-react';

type ActivityLog = {
  id: string | number;
  fechaAccion: string;
  usuarioEjecutor?: { correo?: string | null } | null;
  usuarioEjecutorId?: string | null;
  accion: string;
  tablaAfectada: string;
  registroId: string;
};

const ACTION_OPTIONS = ['todos', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'] as const;
const TABLE_OPTIONS = ['todos', 'productos', 'ordenes', 'clientes', 'inventario'] as const;

export default function ActividadAdmin() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fechaInicio, setFechaInicio] = useState('2024-01-01');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [accionFilter, setAccionFilter] = useState<(typeof ACTION_OPTIONS)[number]>('todos');
  const [tablaFilter, setTablaFilter] = useState<(typeof TABLE_OPTIONS)[number]>('todos');
  const [isExporting, setIsExporting] = useState(false);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['actividad-logs', page, search, fechaInicio, fechaFin],
    queryFn: () => adminService.getLogsActividad({ page, limit, search, fechaInicio, fechaFin }),
  });

  const logs = (data?.data?.data || []) as ActivityLog[];
  const total = data?.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = accionFilter === 'todos' || log.accion === accionFilter;
      const matchesTable = tablaFilter === 'todos' || log.tablaAfectada === tablaFilter;
      return matchesAction && matchesTable;
    });
  }, [logs, accionFilter, tablaFilter]);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const allData = await adminService.getLogsActividad({
        page: 1,
        limit: 1000,
        search,
        fechaInicio,
        fechaFin,
      });

      const items = ((allData as any)?.data?.data || []) as ActivityLog[];
      const exportItems = items.filter((log) => {
        const matchesAction = accionFilter === 'todos' || log.accion === accionFilter;
        const matchesTable = tablaFilter === 'todos' || log.tablaAfectada === tablaFilter;
        return matchesAction && matchesTable;
      });

      if (exportItems.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const headers = ['Fecha', 'Usuario', 'Email', 'Accion', 'Tabla', 'ID Entidad'];
      const csvRows = exportItems.map((log) => [
        new Date(log.fechaAccion).toLocaleString('es-PE'),
        'Sistema',
        log.usuarioEjecutor?.correo || 'system',
        log.accion,
        log.tablaAfectada,
        log.registroId,
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));

      const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_actividad_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Exportación completada');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  const getBadgeColor = (accion: string) => {
    if (accion.includes('CREATE')) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    if (accion.includes('UPDATE')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    if (accion.includes('DELETE')) return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight">
            <History className="h-8 w-8 text-primary" />
            Logs de Actividad
          </h1>
          <p className="mt-1 font-medium text-muted-foreground">Historial detallado de todas las acciones realizadas en el sistema.</p>
        </div>
        <Button
          variant="outline"
          className="h-12 gap-2 rounded-2xl border-2 font-bold transition-all duration-300 hover:bg-primary hover:text-white"
          onClick={handleExportCSV}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-3">
          <Card className="overflow-hidden rounded-3xl border-2 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Filter className="h-4 w-4 text-primary" />
                Filtros Temporales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DateRangeFilter
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                onChange={(inicio, fin) => {
                  setFechaInicio(inicio);
                  setFechaFin(fin);
                  setPage(1);
                }}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-2 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                <Info className="h-4 w-4 text-primary" />
                Resumen Rápido
              </CardTitle>
              <CardDescription>Total de registros obtenidos en el periodo actual.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border-2 border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-bold uppercase text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-black text-primary">{total}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-9">
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pt-0">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por accion, tabla o usuario..."
                    className="h-14 rounded-2xl border-2 bg-background pl-12 font-medium transition-all focus:ring-primary/20"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto">
                  <div className="flex min-w-[180px] flex-1 flex-col gap-1 xl:flex-none">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de accion</label>
                    <select
                      value={accionFilter}
                      onChange={(e) => setAccionFilter(e.target.value as typeof accionFilter)}
                      className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold"
                    >
                      {ACTION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option === 'todos' ? 'Todas' : option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex min-w-[180px] flex-1 flex-col gap-1 xl:flex-none">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tabla afectada</label>
                    <select
                      value={tablaFilter}
                      onChange={(e) => setTablaFilter(e.target.value as typeof tablaFilter)}
                      className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold"
                    >
                      {TABLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option === 'todos' ? 'Todas' : option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0">
              <div className="overflow-hidden rounded-[2rem] border-2 bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b-2 bg-muted/50 transition-colors">
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Fecha y hora</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Usuario</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Accion</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Entidad</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Referencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="h-10 w-10 animate-spin text-primary" />
                              <p className="font-bold text-muted-foreground">Cargando registros...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <History className="h-12 w-12 text-muted-foreground/30" />
                              <p className="text-lg font-bold text-muted-foreground">No se encontraron registros</p>
                              <Button
                                variant="link"
                                onClick={() => {
                                  setSearch('');
                                  setAccionFilter('todos');
                                  setTablaFilter('todos');
                                }}
                              >
                                Limpiar filtros
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={String(log.id)} className="group transition-all duration-200 hover:bg-muted/30">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                  <Clock className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-foreground">{new Date(log.fechaAccion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  <span className="text-xs font-bold text-muted-foreground/60">{new Date(log.fechaAccion).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                  {(log.usuarioEjecutor?.correo || 'S')[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold leading-tight text-foreground">{log.usuarioEjecutor?.correo || 'Sistema'}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground/60">ID: {log.usuarioEjecutorId || 'SYS'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <Badge variant="outline" className={`h-8 rounded-xl border-2 px-3 font-bold ${getBadgeColor(log.accion)}`}>
                                {log.accion}
                              </Badge>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{log.tablaAfectada}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <code className="w-fit rounded-lg border border-primary/10 bg-primary/5 px-2 py-1 text-xs font-bold text-primary">
                                {log.registroId}
                              </code>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-4 border-t-2 bg-muted/20 px-6 py-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Pagina {page} de {totalPages} • {filteredLogs.length} registros visibles
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-xl border-2 px-4 font-bold gap-2"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-xl border-2 px-4 font-bold gap-2"
                      disabled={page === totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
