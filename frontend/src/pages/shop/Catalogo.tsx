import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productoService } from '@/services/producto.service';
import { categoriaService } from '@/services/categoria.service';
import { ProductCard } from '@/components/producto/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const categoriaId = searchParams.get('categoriaId') || '';
  const precioMin = searchParams.get('precioMin') ? Number(searchParams.get('precioMin')) : undefined;
  const precioMax = searchParams.get('precioMax') ? Number(searchParams.get('precioMax')) : undefined;
  const orderBy = searchParams.get('orderBy') || 'created_at_desc';

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos', page, search, categoriaId, precioMin, precioMax, orderBy],
    queryFn: () => productoService.getCatalogo({ 
      page, 
      limit: 12, 
      search, 
      categoriaId, 
      precioMin, 
      precioMax, 
      orderBy 
    }),
  });

  const { data: categoriasRes } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriaService.listar(),
  });

  const updateFilters = (newFilters: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    params.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateFilters({ search: formData.get('search') as string });
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const categorias = categoriasRes?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar de Filtros (Desktop) */}
        <aside className="hidden md:block w-64 flex-shrink-0 space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Categorías</h3>
            <div className="space-y-2">
              <button
                onClick={() => updateFilters({ categoriaId: '' })}
                className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                  !categoriaId ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20' : 'hover:bg-muted dark:hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                Todas las categorías
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilters({ categoriaId: cat.id })}
                  className={`block w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                    categoriaId === cat.id ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20' : 'hover:bg-muted dark:hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Rango de Precio</h3>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                className="h-9 text-sm bg-background dark:bg-muted/10"
                value={precioMin || ''}
                onChange={(e) => updateFilters({ precioMin: e.target.value || undefined })}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                className="h-9 text-sm bg-background dark:bg-muted/10"
                value={precioMax || ''}
                onChange={(e) => updateFilters({ precioMax: e.target.value || undefined })}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Ordenar por</h3>
            <select
              value={orderBy}
              onChange={(e) => updateFilters({ orderBy: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background dark:bg-muted/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="created_at_desc">Novedades</option>
              <option value="precio_asc">Precio: Menor a Mayor</option>
              <option value="precio_desc">Precio: Mayor a Menor</option>
              <option value="nombre_asc">Nombre: A-Z</option>
              <option value="nombre_desc">Nombre: Z-A</option>
            </select>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={clearFilters}
          >
            Limpiar Filtros
          </Button>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1">
          <div className="flex flex-col gap-6">
            
            {/* Cabecera y Búsqueda */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Nuestro Catálogo</h1>
                <p className="text-sm text-muted-foreground">
                  {productos?.data.total || 0} productos encontrados
                </p>
              </div>

              <div className="flex items-center gap-2">
                <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="search"
                    defaultValue={search}
                    placeholder="Buscar productos..."
                    className="pl-9 h-10 bg-background dark:bg-muted/10"
                  />
                </form>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filtros Activos (Chips) */}
            {(search || categoriaId || precioMin || precioMax) && (
              <div className="flex flex-wrap gap-2">
                {search && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-muted dark:bg-muted/50 rounded-full text-xs font-medium">
                    Búsqueda: {search}
                    <button onClick={() => updateFilters({ search: '' })}><X className="h-3 w-3" /></button>
                  </div>
                )}
                {categoriaId && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-muted dark:bg-muted/50 rounded-full text-xs font-medium">
                    Categoría: {categorias.find(c => c.id === categoriaId)?.nombre}
                    <button onClick={() => updateFilters({ categoriaId: '' })}><X className="h-3 w-3" /></button>
                  </div>
                )}
                {(precioMin || precioMax) && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-muted dark:bg-muted/50 rounded-full text-xs font-medium">
                    Precio: ${precioMin || 0} - ${precioMax || '+'}
                    <button onClick={() => updateFilters({ precioMin: '', precioMax: '' })}><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            )}

            {/* Rejilla de Productos */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[350px] rounded-xl bg-muted dark:bg-muted/20 animate-pulse" />
                ))}
              </div>
            ) : productos?.data.data.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 dark:bg-muted/5 rounded-2xl border-2 border-dashed border-border dark:border-primary/10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted dark:bg-muted/20 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">No encontramos productos</h3>
                <p className="text-muted-foreground mb-6">Intenta ajustar tus filtros o búsqueda.</p>
                <Button onClick={clearFilters}>Ver todo el catálogo</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {productos?.data.data.map((p) => (
                    <ProductCard key={p.id} producto={p} />
                  ))}
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-center gap-4 mt-12 border-t pt-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateFilters({ page: page - 1 })}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center rounded-md">
                      {page}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      de {productos?.data.total ? Math.ceil(productos.data.total / 12) : 1}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= (productos?.data.total ? Math.ceil(productos.data.total / 12) : 1)}
                    onClick={() => updateFilters({ page: page + 1 })}
                    className="gap-1"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Filtros (Mobile) */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Filtros</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              {/* Mismos filtros que arriba, pero adaptados si es necesario */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!categoriaId ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilters({ categoriaId: '' })}
                  >
                    Todas
                  </Button>
                  {categorias.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={categoriaId === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ categoriaId: cat.id })}
                    >
                      {cat.nombre}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Rango de Precio</h3>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    value={precioMin || ''}
                    onChange={(e) => updateFilters({ precioMin: e.target.value || undefined })}
                  />
                  <Input
                    type="number"
                    placeholder="Máximo"
                    value={precioMax || ''}
                    onChange={(e) => updateFilters({ precioMax: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Ordenar por</h3>
                <select
                  value={orderBy}
                  onChange={(e) => updateFilters({ orderBy: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-input bg-background text-base"
                >
                  <option value="created_at_desc">Novedades</option>
                  <option value="precio_asc">Precio: Menor a Mayor</option>
                  <option value="precio_desc">Precio: Mayor a Menor</option>
                  <option value="nombre_asc">Nombre: A-Z</option>
                  <option value="nombre_desc">Nombre: Z-A</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t mt-auto">
              <Button className="w-full h-12 text-lg font-bold" onClick={() => setIsFilterOpen(false)}>
                Ver {productos?.data.total || 0} resultados
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
