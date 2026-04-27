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
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpDown,
  Download,
  Loader2,
  Package,
  MapPin,
  User,
  X
} from 'lucide-react';

export default function OrdenesAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('2024-01-01');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrden, setSelectedOrden] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['ordenes-admin', page, search, estado, fechaInicio, fechaFin],
    queryFn: () => ordenService.listarTodas({ page, limit, search, estado, fechaInicio, fechaFin }),
    refetchInterval: 30000, // Refrescar cada 30 segundos
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Órdenes</h1>
          <p className="text-muted-foreground mt-1">Gestiona y supervisa todas las transacciones de la tienda.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button size="sm" className="h-9 gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 mb-6">
        <CardContent className="pt-6">
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

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por número o cliente..." 
                className="pl-9 h-10 bg-background"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PAGADA">Pagada</option>
              <option value="ENVIADA">Enviada</option>
              <option value="ENTREGADA">Entregada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b transition-colors">
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Orden <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-center">Estado</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-muted-foreground">Cargando órdenes...</p>
                      </td>
                    </tr>
                  ) : ordenes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No se encontraron órdenes.
                      </td>
                    </tr>
                  ) : (
                    ordenes.map(o => (
                      <tr key={o.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <span className="font-bold text-primary tabular-nums">{o.numeroOrden}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium text-foreground">{o.cliente?.nombres} {o.cliente?.apellidos}</span>
                            <span className="text-xs text-muted-foreground">{o.cliente?.usuario?.correo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                          {new Date(o.created_at).toLocaleDateString()} {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-4 text-right font-medium tabular-nums">
                          S/ {Number(o.totalFinal).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getStatusBadge(o.estado?.nombre)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleViewDetails(o.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {o.estado?.nombre === 'PENDIENTE' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                                onClick={() => changeStateMutation.mutate({ id: o.id, estadoId: 9, comentario: 'Pago verificado por administrador' })}
                                disabled={changeStateMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages || 1} ({total} órdenes totales)
              </span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2"
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
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
                      onClick={() => changeStateMutation.mutate({ id: selectedOrden.id, estadoId: 10, comentario: 'Cancelada por administrador' })}
                      disabled={changeStateMutation.isPending}
                    >
                      Cancelar Orden
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => changeStateMutation.mutate({ id: selectedOrden.id, estadoId: 9, comentario: 'Pago verificado' })}
                      disabled={changeStateMutation.isPending}
                    >
                      Marcar como Pagada
                    </Button>
                  </>
                )}
                {selectedOrden.estado?.nombre === 'PAGADA' && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => changeStateMutation.mutate({ id: selectedOrden.id, estadoId: 8, comentario: 'Orden enviada' })}
                    disabled={changeStateMutation.isPending}
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