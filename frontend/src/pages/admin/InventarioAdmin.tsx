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
  X,
  Download,
  Filter,
  ArrowUpDown,
  RefreshCcw,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function InventarioAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAjusteOpen, setIsAjusteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<string>('');
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
    queryKey: ['inventario-movimientos', page, search, tipoMovimiento],
    queryFn: () => inventarioService.getMovimientos({ 
      page, 
      limit, 
      search,
      // @ts-ignore
      tipoMovimiento: tipoMovimiento || undefined
    }),
  });

  const { data: productosData } = useQuery({
    queryKey: ['productos-admin-list'],
    queryFn: () => productoService.listarAdmin({ page: 1, limit: 100 }),
  });

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const allData = await inventarioService.getMovimientos({ 
        page: 1, 
        limit: 1000,
        search,
        // @ts-ignore
        tipoMovimiento: tipoMovimiento || undefined
      });

      const items = allData.data.data;
      if (!items || items.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const headers = ['ID', 'Producto', 'SKU', 'Tipo', 'Cantidad', 'Fecha', 'Referencia', 'Motivo'];
      const csvRows = items.map(m => [
        m.id,
        `"${m.stock?.producto?.nombre.replace(/"/g, '""')}"`,
        m.stock?.producto?.sku || 'N/A',
        m.tipoMovimiento,
        m.cantidad,
        new Date(m.created_at).toISOString().split('T')[0],
        m.referenciaTipo,
        `"${(m.comentario || '').replace(/"/g, '""')}"`
      ].join(','));

      const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `inventario_export_${new Date().toISOString().split('T')[0]}.csv`);
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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            Control de Inventario
          </h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Monitoreo de Stock y Movimientos</p>
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
          <Button 
            className="h-10 px-6 gap-2 font-black shadow-xl shadow-primary/20 active:scale-95 transition-all"
            onClick={() => setIsAjusteOpen(true)}
          >
            <ArrowRightLeft className="h-5 w-5" /> NUEVO AJUSTE
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Alertas */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-2 border-rose-100 bg-rose-50/10 rounded-[2rem] overflow-hidden shadow-xl shadow-rose-900/5 ring-1 ring-rose-200/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black flex items-center gap-2 text-rose-700 uppercase tracking-tight">
                <AlertTriangle className="h-5 w-5 animate-pulse" /> Críticos / Alertas
              </CardTitle>
              <CardDescription className="text-rose-600/70 font-bold text-[10px] uppercase tracking-widest">Reponer inmediatamente</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAlertas ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                  <span className="text-[10px] font-black uppercase text-rose-400">Escaneando niveles...</span>
                </div>
              ) : alertasStock.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <RefreshCcw className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Todo en orden</p>
                  <p className="text-[10px] text-muted-foreground mt-1">No hay alertas de stock bajo.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertasStock.map((alerta: any) => (
                    <div key={alerta.id} className="group flex items-center justify-between p-4 bg-white border-2 border-rose-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-xs text-slate-800 truncate">{alerta.nombre}</span>
                        <Badge variant="secondary" className="w-fit text-[8px] font-black mt-1 uppercase tracking-tighter">SKU: {alerta.sku}</Badge>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-black text-rose-600 tabular-nums">{alerta.disponible}</div>
                        <div className="text-[8px] font-bold text-rose-400 uppercase">Mín: {alerta.stock_minimo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Resumen Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60">Entradas hoy</span>
                </div>
                <span className="text-lg font-black">12</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-rose-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60">Salidas hoy</span>
                </div>
                <span className="text-lg font-black">45</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial principal */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por SKU o producto..." 
                className="pl-11 h-12 bg-card border-2 rounded-2xl font-medium focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 border-2 rounded-2xl font-bold gap-2">
                  <Filter className="h-4 w-4" /> 
                  {tipoMovimiento || 'Todos los Movimientos'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl shadow-xl">
                <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Filtrar por Tipo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTipoMovimiento('')} className="font-bold">Todos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTipoMovimiento('ENTRADA')} className="font-bold">Entradas (Compras)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTipoMovimiento('SALIDA')} className="font-bold">Salidas (Ajustes)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTipoMovimiento('VENTA')} className="font-bold">Ventas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTipoMovimiento('GANANCIA')} className="font-bold">Ganancias (Manual)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTipoMovimiento('PERDIDA')} className="font-bold text-rose-600">Pérdidas (Manual)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="h-12 border-2 rounded-2xl font-black text-xs uppercase tracking-widest gap-2">
              <ArrowUpDown className="h-4 w-4" /> Ordenar: Más Recientes
            </Button>
          </div>

          <Card className="border-2 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5 ring-1 ring-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Producto / SKU</th>
                      <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Tipo de Operación</th>
                      <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px] text-center">Variación</th>
                      <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Fecha / Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoadingMovimientos ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Cargando bitácora...</p>
                          </div>
                        </td>
                      </tr>
                    ) : historial.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="h-12 w-12 text-muted-foreground/30 mb-2" />
                            <p className="text-muted-foreground font-bold">No se encontraron movimientos.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      historial.map((m: any) => (
                        <tr key={m.id} className="group hover:bg-muted/20 transition-all duration-300">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-foreground truncate max-w-[200px]">{m.stock?.producto?.nombre}</span>
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">SKU: {m.stock?.producto?.sku || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getTipoMovimientoBadge(m.tipoMovimiento)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className={cn(
                              "inline-flex items-center px-3 py-1 rounded-full font-black text-xs tabular-nums",
                              m.tipoMovimiento === 'SALIDA' || m.tipoMovimiento === 'PERDIDA' || m.tipoMovimiento === 'VENTA' 
                                ? "bg-rose-50 text-rose-600" 
                                : "bg-emerald-50 text-emerald-600"
                            )}>
                              {m.tipoMovimiento === 'SALIDA' || m.tipoMovimiento === 'PERDIDA' || m.tipoMovimiento === 'VENTA' ? '-' : '+'}{m.cantidad}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
                              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{m.referenciaTipo.replace('_', ' ')}</span>
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
                    Página {page} de {totalPages || 1}
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
        </div>
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