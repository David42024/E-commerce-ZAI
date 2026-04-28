import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productoService } from '@/services/producto.service';
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
  Layers,
  AlertCircle,
  ExternalLink,
  Grid,
  List,
  Loader2,
  X
} from 'lucide-react';

export default function ProductosAdmin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<any>(null);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['productos-admin', page, search],
    queryFn: () => productoService.listarAdmin({ page, limit, search }),
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

  const getStockBadge = (stock: number) => {
    if (stock <= 0) return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200">Agotado</Badge>;
    if (stock <= 5) return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Bajo Stock</Badge>;
    return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">{stock} unidades</Badge>;
  };

  const productos = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Productos</h1>
          <p className="text-muted-foreground mt-1 font-medium">Gestiona tu inventario, precios y categorías.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-lg border">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-background shadow-sm">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            className="h-10 px-4 gap-2 font-bold shadow-lg shadow-primary/20"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, SKU o categoría..." 
                className="pl-9 h-11 bg-background ring-offset-background"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-11 gap-2 border-muted-foreground/20 font-medium">
                <Filter className="h-4 w-4" /> Categorías
              </Button>
              <Button variant="outline" className="h-11 gap-2 border-muted-foreground/20 font-medium">
                <Layers className="h-4 w-4" /> Masivo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-2">
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden ring-1 ring-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b transition-colors">
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Producto</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">SKU</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Categoría</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">P. Compra</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">P. Venta</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-center">Inventario</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-muted-foreground font-medium">Cargando productos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : productos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-muted-foreground font-medium">No se encontraron productos.</p>
                      </td>
                    </tr>
                  ) : (
                    productos.map(p => (
                      <tr key={p.id} className="group hover:bg-muted/20 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                              <img 
                                src={p.imagenes?.[0]?.url || '/images/default.svg'} 
                                alt={p.nombre} 
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-foreground truncate max-w-[200px]">{p.nombre}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">Pro</span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground font-medium">{p.sku}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            {p.categoria?.nombre || 'Sin categoría'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-muted-foreground tabular-nums text-xs">S/ {Number(p.precioVenta).toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-foreground tabular-nums">S/ {Number(p.precioVenta).toFixed(2)}</span>
                            <span className="text-[10px] text-muted-foreground text-right">IVA incluido</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStockBadge(p.stock?.stockFisico || 0)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              onClick={() => handleEdit(p)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>{productos.filter(p => (p.stock?.stockFisico || 0) <= 5).length} productos con stock crítico</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground font-medium">Página {page} de {totalPages || 1}</span>
                <div className="flex gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-md" 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    &lt;
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button 
                      key={i}
                      variant="outline" 
                      size="sm" 
                      className={`h-8 w-8 p-0 rounded-md transition-colors ${page === i + 1 ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-md hover:bg-accent transition-colors"
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-2xl">{editingProducto ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
                <CardDescription>
                  {editingProducto ? 'Actualiza la información del producto.' : 'Completa los datos para añadir un nuevo producto.'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
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