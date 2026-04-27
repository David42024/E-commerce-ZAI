import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioService } from '@/services/inventario.service';
import { productoService } from '@/services/producto.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { 
  AlertTriangle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Loader2,
  Package,
  ArrowRightLeft,
  X
} from 'lucide-react';

export default function InventarioAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<any>(null);
  const [ajusteData, setAjusteData] = useState({
    cantidad: 1,
    tipo: 'GANANCIA' as 'GANANCIA' | 'PERDIDA',
    motivo: ''
  });
  
  const limit = 10;

  const { data: alertas, isLoading: isLoadingAlertas } = useQuery({
    queryKey: ['inventario-alertas'],
    queryFn: () => inventarioService.getAlertas(),
  });

  const { data: movimientos, isLoading: isLoadingMovimientos } = useQuery({
    queryKey: ['inventario-movimientos', page, search],
    queryFn: () => inventarioService.getMovimientos({ page, limit, search }),
  });

  const { data: productosData } = useQuery({
    queryKey: ['productos-admin-list'],
    queryFn: () => productoService.listarAdmin({ page: 1, limit: 100 }),
  });

  const ajusteMutation = useMutation({
    mutationFn: (data: any) => inventarioService.ajustarStock(data.productoId, data.ajuste),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-alertas'] });
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      setIsAjusteOpen(false);
      setAjusteData({ cantidad: 1, tipo: 'GANANCIA', motivo: '' });
      setSelectedProducto(null);
      toast.success('Ajuste de inventario realizado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al realizar el ajuste');
    }
  });

  const handleAjusteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProducto) return;
    ajusteMutation.mutate({
      productoId: selectedProducto.id,
      ajuste: ajusteData
    });
  };

  const getTipoMovimientoBadge = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
      case 'GANANCIA':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><ArrowUpRight className="h-3 w-3 mr-1" /> Entrada</Badge>;
      case 'SALIDA':
      case 'PERDIDA':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200"><ArrowDownRight className="h-3 w-3 mr-1" /> Salida</Badge>;
      case 'RESERVA':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><History className="h-3 w-3 mr-1" /> Reserva</Badge>;
      case 'VENTA':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200"><Package className="h-3 w-3 mr-1" /> Venta</Badge>;
      default:
        return <Badge variant="secondary">{tipo}</Badge>;
    }
  };

  const alertasStock = alertas?.data || [];
  const historial = movimientos?.data?.data || [];
  const totalMovimientos = movimientos?.data?.total || 0;
  const totalPages = Math.ceil(totalMovimientos / limit);
  const productos = productosData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h1>
          <p className="text-muted-foreground mt-1">Control de stock, alertas y movimientos históricos.</p>
        </div>
        <Button onClick={() => setIsAjusteOpen(true)} className="gap-2">
          <ArrowRightLeft className="h-4 w-4" /> Nuevo Ajuste
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas de Stock Bajo */}
        <Card className="lg:col-span-1 border-rose-100 bg-rose-50/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-rose-700">
              <AlertTriangle className="h-5 w-5" /> Alertas de Stock Bajo
            </CardTitle>
            <CardDescription>Productos que requieren reposición inmediata.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAlertas ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
              </div>
            ) : alertasStock.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No hay alertas de stock bajo actualmente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertasStock.map((alerta: any) => (
                  <div key={alerta.id} className="flex items-center justify-between p-3 bg-white border border-rose-100 rounded-lg shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm truncate max-w-[150px]">{alerta.nombre}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{alerta.sku}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-600">{alerta.disponible} uds.</div>
                      <div className="text-[10px] text-muted-foreground">Mín: {alerta.stock_minimo}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de Movimientos */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Historial de Movimientos</CardTitle>
              <CardDescription>Registro detallado de entradas y salidas de stock.</CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por SKU o producto..." 
                className="pl-9 h-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium text-center">Cant.</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Ref.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoadingMovimientos ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </td>
                    </tr>
                  ) : historial.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        No hay movimientos registrados.
                      </td>
                    </tr>
                  ) : (
                    historial.map((m: any) => (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[150px]">{m.stock?.producto?.nombre}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{m.stock?.producto?.sku}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getTipoMovimientoBadge(m.tipoMovimiento)}
                        </td>
                        <td className={`px-4 py-3 text-center font-bold ${m.tipoMovimiento === 'SALIDA' || m.tipoMovimiento === 'PERDIDA' || m.tipoMovimiento === 'VENTA' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {m.tipoMovimiento === 'SALIDA' || m.tipoMovimiento === 'PERDIDA' || m.tipoMovimiento === 'VENTA' ? '-' : '+'}{m.cantidad}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] uppercase">{m.referenciaTipo.replace('_', ' ')}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8"
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Ajuste */}
      {isAjusteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" /> Ajuste Manual de Stock
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAjusteOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAjusteSubmit}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Producto a ajustar</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    value={selectedProducto?.id || ''}
                    onChange={(e) => {
                      const prod = productos.find((p: any) => p.id === e.target.value);
                      setSelectedProducto(prod);
                    }}
                  >
                    <option value="">Selecciona un producto</option>
                    {productos.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Ajuste</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={ajusteData.tipo}
                      onChange={(e) => setAjusteData({...ajusteData, tipo: e.target.value as any})}
                    >
                      <option value="GANANCIA">Entrada (Ganancia)</option>
                      <option value="PERDIDA">Salida (Pérdida)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={ajusteData.cantidad}
                      onChange={(e) => setAjusteData({...ajusteData, cantidad: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo / Comentario</label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Reposición de inventario, Producto dañado..."
                    value={ajusteData.motivo}
                    onChange={(e) => setAjusteData({...ajusteData, motivo: e.target.value})}
                    required
                  />
                </div>

                {selectedProducto && (
                  <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock Actual Físico:</span>
                      <span className="font-bold">{selectedProducto.stock?.stockFisico || 0}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="text-muted-foreground">Nuevo Stock Estimado:</span>
                      <span className="font-bold text-primary">
                        {ajusteData.tipo === 'GANANCIA' 
                          ? (selectedProducto.stock?.stockFisico || 0) + ajusteData.cantidad 
                          : Math.max(0, (selectedProducto.stock?.stockFisico || 0) - ajusteData.cantidad)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAjusteOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={ajusteMutation.isPending || !selectedProducto}
                >
                  {ajusteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Ajuste
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}