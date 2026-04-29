import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productoService } from '@/services/producto.service';
import { categoriaService } from '@/services/categoria.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductoForm } from '@/components/admin/ProductoForm';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Package, 
  ExternalLink,
  Loader2,
  X,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProductosAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<string>('createdAt_DESC');
  const [stockFilter, setStockFilter] = useState<string>('todos');
  
  const limit = 10;

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriaService.listar(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['productos-admin', page, search, selectedCategoria, orderBy],
    queryFn: () => productoService.listarAdmin({
      page,
      limit,
      search: search || undefined,
      categoriaId: selectedCategoria,
      orderBy,
    }),
  });

  const saveMutation = useMutation({
    mutationFn: (formData: any) => {
      if (editingProducto) {
        return productoService.actualizarProducto(editingProducto.id, formData);
      }
      return productoService.crearProducto(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setIsFormOpen(false);
      setEditingProducto(null);
      toast.success(editingProducto ? 'Producto actualizado' : 'Producto creado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar el producto');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productoService.eliminarProducto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos-admin'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Producto eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el producto');
    }
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleEdit = (producto: any) => {
    setEditingProducto(producto);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProducto(null);
    setIsFormOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const allData = await productoService.listarAdmin({ 
        page: 1, 
        limit: 1000,
        search,
      });

      const items = allData.data.data;
      if (!items || items.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const headers = ['ID', 'Nombre', 'SKU', 'Categoría', 'Precio Venta', 'Stock Físico', 'Stock Comprometido', 'Stock Disponible'];
      const csvRows = items.filter((p: any) => {
        if (!selectedCategoria) return true;
        return p.categoria?.id === selectedCategoria;
      }).map((p: any) => [
        p.id,
        `"${p.nombre.replace(/"/g, '""')}"`,
        p.sku || 'N/A',
        p.categoria?.nombre || 'General',
        p.precioVenta,
        p.stock?.stockFisico || 0,
        p.stock?.stockReservado || 0,
        (p.stock?.stockFisico || 0) - (p.stock?.stockReservado || 0)
      ].join(','));

      const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `productos_export_${new Date().toISOString().split('T')[0]}.csv`);
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

  const getStockBadge = (stock: number) => {
    if (stock <= 0) return (
      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 px-2">
        <XCircle className="h-3 w-3" /> Agotado
      </Badge>
    );
    if (stock <= 5) return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 px-2">
        <AlertTriangle className="h-3 w-3" /> Bajo Stock
      </Badge>
    );
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 px-2">
        <CheckCircle2 className="h-3 w-3" /> {stock} disp.
      </Badge>
    );
  };

  // Filtrado de stock: se aplica sobre los datos ya devueltos por el backend (es un filtro visual local)
  const productos = (data?.data?.data || []).filter((p: any) => {
    if (stockFilter === 'agotado') return (p.stock?.stockFisico || 0) <= 0;
    if (stockFilter === 'bajo') return (p.stock?.stockFisico || 0) > 0 && (p.stock?.stockFisico || 0) <= 5;
    if (stockFilter === 'disponible') return (p.stock?.stockFisico || 0) > 5;
    return true;
  });

  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const activeFiltersCount = [selectedCategoria, stockFilter !== 'todos'].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Catálogo Maestro
          </h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Gestión de Inventario y Operaciones</p>
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
            onClick={handleCreate}
          >
            <Plus className="h-5 w-5" /> NUEVO PRODUCTO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, SKU o etiqueta..." 
            className="pl-11 h-12 bg-card border-2 rounded-2xl font-medium focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        
        <div className="flex min-w-[150px] flex-1 flex-col gap-1 md:flex-none">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" /> Categoría
          </label>
          <select
            className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold transition-colors focus:border-primary"
            value={selectedCategoria || 'all'}
            onChange={(e) => { setSelectedCategoria(e.target.value === 'all' ? null : e.target.value); setPage(1); }}
          >
            <option value="all">Todas</option>
            {(categorias?.data || []).map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex min-w-[150px] flex-1 flex-col gap-1 md:flex-none">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" /> Stock
          </label>
          <select
            className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold transition-colors focus:border-primary"
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
          >
            <option value="todos">Todos</option>
            <option value="disponible">✅ Disponible (&gt;5)</option>
            <option value="bajo">⚠️ Bajo Stock (1-5)</option>
            <option value="agotado">❌ Agotado (0)</option>
          </select>
        </div>

        <div className="flex min-w-[150px] flex-1 flex-col gap-1 md:flex-none">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Ordenar
          </label>
          <select
            className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold transition-colors focus:border-primary"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
          >
            <option value="createdAt_DESC">Más recientes</option>
            <option value="precioVenta_ASC">Precio ↑</option>
            <option value="precioVenta_DESC">Precio ↓</option>
            <option value="nombre_ASC">Nombre A-Z</option>
            <option value="stock_ASC">Stock: Crítico</option>
          </select>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtros activos:</span>
          {selectedCategoria && (
            <Badge variant="secondary" className="gap-1 font-bold text-xs rounded-xl px-3 h-7">
              <Filter className="h-3 w-3" />
              {(categorias?.data || []).find((c: any) => c.id === selectedCategoria)?.nombre || 'Categoría'}
              <button onClick={() => setSelectedCategoria(null)} className="ml-1 hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {stockFilter !== 'todos' && (
            <Badge variant="secondary" className="gap-1 font-bold text-xs rounded-xl px-3 h-7">
              <Package className="h-3 w-3" />
              {stockFilter === 'disponible' ? 'Disponible' : stockFilter === 'bajo' ? 'Bajo Stock' : 'Agotado'}
              <button onClick={() => setStockFilter('todos')} className="ml-1 hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-bold text-destructive hover:text-destructive/80"
            onClick={() => { setSelectedCategoria(null); setStockFilter('todos'); setSearch(''); setPage(1); }}
          >
            Limpiar todo
          </Button>
        </div>
      )}

      <Card className="border-2 rounded-[2rem] overflow-hidden shadow-xl shadow-black/5 ring-1 ring-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Detalle Producto</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Identificación</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px]">Categoría</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px] text-right">Precios (S/)</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px] text-center">Estado Stock</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[10px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Sincronizando inventario...</p>
                      </div>
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground font-bold">No se encontraron productos con los filtros aplicados.</p>
                        <Button variant="link" onClick={() => { setSearch(''); setSelectedCategoria(null); }} className="text-primary font-black uppercase text-xs">Limpiar filtros</Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  productos.map(p => (
                    <tr key={p.id} className="group hover:bg-muted/20 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 bg-muted flex-shrink-0 shadow-sm ring-1 ring-black/5">
                            <img 
                              src={p.imagenes?.[0]?.url || '/images/default.svg'} 
                              alt={p.nombre} 
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-foreground text-sm truncate max-w-[250px]">{p.nombre}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[9px] font-black uppercase px-1.5 h-4">ID: {p.id.slice(0,8)}</Badge>
                              <a href={`/producto/${p.id}`} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="h-3 w-3 text-primary hover:scale-110 transition-transform" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded w-fit">SKU: {p.sku || 'N/A'}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">UPC: {p.id.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest border-2">
                          {p.categoria?.nombre || 'General'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-foreground text-base tabular-nums">S/ {Number(p.precioVenta).toFixed(2)}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Unitario</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {getStockBadge(p.stock?.stockFisico || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl border-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                            onClick={() => handleEdit(p)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl border-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl shadow-xl">
                              <DropdownMenuItem className="font-bold">Duplicar Producto</DropdownMenuItem>
                              <DropdownMenuItem className="font-bold">Historial de Stock</DropdownMenuItem>
                              <DropdownMenuItem className="font-bold text-rose-600">Desactivar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                Mostrando {productos.length} de {total} registros
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

      {/* Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl rounded-[2.5rem] border-none ring-1 ring-white/10">
            <CardHeader className="flex flex-row items-center justify-between border-b p-8 bg-card">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black uppercase tracking-tight">
                  {editingProducto ? 'Actualizar Ficha' : 'Nueva Alta de Producto'}
                </CardTitle>
                <CardDescription className="font-bold text-xs uppercase tracking-widest">
                  {editingProducto ? `Editando registro: ${editingProducto.sku || editingProducto.id.slice(0,8)}` : 'Ingrese los datos maestros del nuevo producto'}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsFormOpen(false)}
                className="h-12 w-12 rounded-2xl hover:bg-muted"
              >
                <X className="h-6 w-6" />
              </Button>
            </CardHeader>
            <CardContent className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ProductoForm 
                producto={editingProducto} 
                onSave={(data) => saveMutation.mutateAsync(data)} 
                onCancel={() => setIsFormOpen(false)}
                isSaving={saveMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
