import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordenService } from '@/services/orden.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Loader2,
  Package,
  MapPin,
  User,
  X,
  Calendar,
  ClipboardList,
  Plus
} from 'lucide-react';

import { cn } from '@/lib/utils';


const ESTADOS = {
  PENDIENTE: 6,
  PAGADA: 7,
  ENTREGADA: 8,
  ENVIADA: 9,
  CANCELADA: 10
};

const OPCIONES_ESTADO = [
  { id: ESTADOS.PENDIENTE, label: 'Pendiente' },
  { id: ESTADOS.PAGADA, label: 'Pagada' },
  { id: ESTADOS.ENVIADA, label: 'Enviada' },
  { id: ESTADOS.ENTREGADA, label: 'Entregada' },
  { id: ESTADOS.CANCELADA, label: 'Cancelada' },
];

export default function OrdenesAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('2024-01-01');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrden, setSelectedOrden] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [orderBy, setOrderBy] = useState<string>('created_at_DESC');

  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['ordenes-admin', page, search, estado, fechaInicio, fechaFin, orderBy],
    queryFn: () => ordenService.listarTodas({
      page,
      limit,
      search,
      estado,
      fechaInicio,
      fechaFin,
      // @ts-ignore
      orderBy
    }),
    refetchInterval: 30000,
  });

  const changeStateMutation = useMutation({
    mutationFn: ({ id, estadoId, comentario }: { id: string, estadoId: number, comentario?: string }) =>
      ordenService.cambiarEstado(id, { nuevoEstadoId: estadoId, comentario }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-admin'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      if (selectedOrden) {
        // Refresh details if open
        ordenService.getOrdenDetalle(selectedOrden.id).then(res => setSelectedOrden(res.data));
      }
      toast.success('Estado de la orden actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el estado');
    }
  });

  const handleViewDetails = async (id: string) => {
    try {
      const res = await ordenService.getOrdenDetalle(id);
      setSelectedOrden(res.data);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error('Error al cargar los detalles de la orden');
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const allData = await ordenService.listarTodas({
        page: 1,
        limit: 1000,
        search,
        estado,
        fechaInicio,
        fechaFin,
        // @ts-ignore
        orderBy
      });

      const items = allData.data.data;
      if (!items || items.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const headers = ['Orden #', 'Cliente', 'Email', 'Fecha', 'Total', 'Estado', 'Metodo Pago', 'Metodo Envio'];
      const csvRows = (items as any[]).map((o: any) => [
        o.numeroOrden,
        `"${o.cliente?.nombres} ${o.cliente?.apellidos}"`,
        o.cliente?.usuario?.correo,
        new Date(o.created_at).toISOString().split('T')[0],
        o.totalFinal,
        o.estado?.nombre,
        o.metodoPago?.nombre || o.metodoPago || 'N/A',
        o.metodoEnvio?.nombre || o.metodoEnvio || 'N/A'
      ].join(','));

      const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ordenes_export_${new Date().toISOString().split('T')[0]}.csv`);
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

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'PAGADA':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Pagada</Badge>;
      case 'PENDIENTE':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'CANCELADA':
        return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 gap-1"><XCircle className="h-3 w-3" /> Cancelada</Badge>;
      case 'ENVIADA':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><Package className="h-3 w-3" /> Enviada</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1">{estado}</Badge>;
    }
  };

  const ordenes = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const ordenesOrdenadas = [...ordenes].sort((a: any, b: any) => {
    if (orderBy === 'totalFinal_ASC') return Number(a.totalFinal || 0) - Number(b.totalFinal || 0);
    if (orderBy === 'totalFinal_DESC') return Number(b.totalFinal || 0) - Number(a.totalFinal || 0);
    if (orderBy === 'created_at_ASC') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Centro de Operaciones
          </h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Gestión de Órdenes y Transacciones</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 px-4 gap-2 font-bold border-2"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          <Button className="h-10 px-6 gap-2 font-black shadow-xl shadow-primary/20 active:scale-95 transition-all">
            <Plus className="h-5 w-5" /> NUEVA ORDEN
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por # de orden, cliente o email..."
            className="pl-11 h-12 bg-card border-2 rounded-2xl font-medium focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex min-w-[180px] flex-1 flex-col gap-1 md:flex-none">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</label>
          <select
            className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
            <option value="ENVIADA">Enviada</option>
            <option value="ENTREGADA">Entregada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>

        <div className="flex min-w-[180px] flex-1 flex-col gap-1 md:flex-none">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ordenar</label>
          <select
            className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
          >
            <option value="totalFinal_DESC">Total: Mayor a Menor</option>
            <option value="totalFinal_ASC">Total: Menor a Mayor</option>
            <option value="created_at_DESC">Fecha: Más recientes</option>
            <option value="created_at_ASC">Fecha: Más antiguas</option>
          </select>
        </div>
      </div>

      <Card className="border-2 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5 ring-1 ring-border/50">
        <CardContent className="p-8 bg-card/50">
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

      <Card className="border-2 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5 ring-1 ring-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Referencia</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Cliente</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Fecha / Hora</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px] text-right">Total (S/)</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px] text-center">Estado</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Sincronizando órdenes...</p>
                      </div>
                    </td>
                  </tr>
                ) : ordenes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground font-bold">No se encontraron órdenes con los filtros aplicados.</p>
                        <Button variant="link" onClick={() => { setSearch(''); setEstado(''); }} className="text-primary font-black uppercase text-xs">Limpiar filtros</Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ordenesOrdenadas.map((o: any) => (
                    <tr key={o.id} className="group hover:bg-muted/20 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <ClipboardList className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-foreground tabular-nums">{o.numeroOrden}</span>
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">ID: {o.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{o.cliente?.nombres} {o.cliente?.apellidos}</span>
                          <span className="text-xs text-muted-foreground font-medium">{o.cliente?.usuario?.correo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-foreground font-bold">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(o.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-foreground text-base tabular-nums">S/ {Number(o.totalFinal).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {getStatusBadge(o.estado?.nombre)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl border-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                            onClick={() => handleViewDetails(o.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <select
                            className="
                              h-10 rounded-xl border-2 px-3 text-xs font-bold outline-none transition
                              bg-white text-black border-gray-300
                              dark:bg-zinc-900 dark:text-white dark:border-zinc-700
                              focus:ring-2 focus:ring-primary/30
                            "
                            value={o.estado?.nombre}
                            onChange={(e) => {
                              const selected = OPCIONES_ESTADO.find(
                                op => op.label.toUpperCase() === e.target.value
                              );

                              if (!selected) return;

                              if (!confirm(`¿Cambiar a ${selected.label}?`)) return;

                              changeStateMutation.mutate({
                                id: o.id,
                                estadoId: selected.id,
                                comentario: `Cambio a ${selected.label}`
                              });
                            }}
                          >
                            {OPCIONES_ESTADO.map(op => (
                              <option key={op.id} value={op.label.toUpperCase()}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-t bg-muted/20 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Mostrando {ordenes.length} de {total} transacciones
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-2 font-black text-xs uppercase"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-10 w-10 rounded-xl border-2 font-black",
                      page === i + 1 ? "shadow-lg shadow-primary/20" : ""
                    )}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                )).slice(Math.max(0, page - 2), Math.min(totalPages, page + 1))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-2 font-black text-xs uppercase"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {isDetailsOpen && selectedOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Orden {selectedOrden.numeroOrden}
                  {getStatusBadge(selectedOrden.estado?.nombre)}
                </CardTitle>
                <CardDescription>
                  Detalles completos de la transacción y seguimiento.
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Información del Cliente
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-1">
                    <p className="font-bold">{selectedOrden.cliente?.nombres} {selectedOrden.cliente?.apellidos}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrden.cliente?.usuario?.correo}</p>
                    <p className="text-sm text-muted-foreground">Tel: {selectedOrden.cliente?.telefono || 'No proporcionado'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Envío y Entrega
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-1">
                    <p className="text-sm font-medium">{selectedOrden.metodoEnvio?.nombre}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrden.direccionEnvio?.direccion}, {selectedOrden.direccionEnvio?.ciudad}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrden.direccionEnvio?.departamento}, {selectedOrden.direccionEnvio?.codigoPostal}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> Resumen de Productos
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Producto</th>
                        <th className="px-4 py-2 text-center">Cantidad</th>
                        <th className="px-4 py-2 text-right">Precio</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrden.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium">{item.nombreProducto}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-center">{item.cantidad}</td>
                          <td className="px-4 py-3 text-right">S/ {Number(item.precioUnitario).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium">S/ {Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/20 border-t font-medium">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">Subtotal</td>
                        <td className="px-4 py-2 text-right">S/ {Number(selectedOrden.subtotal).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-muted-foreground">IGV (18%)</td>
                        <td className="px-4 py-2 text-right">S/ {Number(selectedOrden.montoIgv).toFixed(2)}</td>
                      </tr>
                      <tr className="text-lg font-bold">
                        <td colSpan={3} className="px-4 py-3 text-right">Total</td>
                        <td className="px-4 py-3 text-right text-primary">S/ {Number(selectedOrden.totalFinal).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                {selectedOrden.estado?.nombre === 'PENDIENTE' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => changeStateMutation.mutate({
                        id: selectedOrden.id,
                        estadoId: ESTADOS.CANCELADA,
                        comentario: 'Cancelada por administrador'
                      })}
                    >
                      Cancelar Orden
                    </Button>

                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => changeStateMutation.mutate({
                        id: selectedOrden.id,
                        estadoId: ESTADOS.PAGADA,
                        comentario: 'Pago verificado'
                      })}
                    >
                      Marcar como Pagada
                    </Button>
                  </>
                )}

                {selectedOrden.estado?.nombre === 'PAGADA' && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => changeStateMutation.mutate({
                      id: selectedOrden.id,
                      estadoId: ESTADOS.ENVIADA,
                      comentario: 'Orden enviada'
                    })}
                  >
                    Marcar como Enviada
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}