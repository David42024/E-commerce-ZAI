import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productoService } from '@/services/producto.service';
import { ProductCard } from '@/components/producto/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos', page, search],
    queryFn: () => productoService.getCatalogo({ page, limit: 12, search }),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSearchParams({ search: formData.get('search') as string, page: '1' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Catálogo de Productos</h1>
          <p className="text-muted-foreground">Explora nuestra selección de productos de alta calidad.</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <Input 
            name="search" 
            defaultValue={search} 
            placeholder="Buscar por nombre, marca..." 
            className="max-w-md h-11" 
          />
          <Button type="submit" className="h-11 px-8 font-bold">
            Buscar
          </Button>
        </form>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">Cargando catálogo...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {productos?.data.data.map((p) => (
                <ProductCard key={p.id} producto={p} />
              ))}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-center gap-4 mt-12 border-t pt-8">
              <Button 
                variant="outline" 
                size="sm"
                disabled={page <= 1} 
                onClick={() => setSearchParams({ search, page: String(page - 1) })}
                className="font-medium"
              >
                Anterior
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Página {page}</span>
                <span className="text-sm text-muted-foreground">
                  de {productos?.data.total ? Math.ceil(productos.data.total / 12) : 1}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                disabled={page >= (productos?.data.total ? Math.ceil(productos.data.total / 12) : 1)} 
                onClick={() => setSearchParams({ search, page: String(page + 1) })}
                className="font-medium"
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}