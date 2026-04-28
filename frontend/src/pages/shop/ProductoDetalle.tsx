import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productoService } from '@/services/producto.service';
import { carritoService } from '@/services/carrito.service';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const [imgSelected, setImgSelected] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: res, isLoading } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => productoService.getDetalle(id!),
    enabled: !!id,
  });

  if (isLoading || !res) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">Cargando detalles del producto...</p>
      </div>
    </div>
  );

  const p = res.data;
  const stockDisponible = (p.stock?.stockFisico ?? 0) - (p.stock?.stockReservado ?? 0);
  const cantidadEnCarrito = items.find((i) => i.productoId === p.id)?.cantidad || 0;
  const limiteAlcanzado = stockDisponible <= 0 || cantidadEnCarrito >= stockDisponible;

  const handleAdd = async () => {
    if (limiteAlcanzado) {
      toast.error('Llegaste al límite de stock disponible');
      return;
    }

    addItem({ 
      productoId: p.id, 
      nombre: p.nombre, 
      precioUnitario: p.precioOferta || p.precioVenta, 
      cantidad: 1, 
      imagenUrl: p.imagenes[imgSelected]?.url,
      stockDisponible,
    });

    // Sincronizar con backend si está logueado
    if (accessToken) {
      try {
        await carritoService.agregarItem(p.id, 1);
      } catch (error) {
        console.error('Error al sincronizar carrito:', error);
      }
    }

    toast.success('Producto agregado al carrito', {
      icon: '🛒',
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Galería de Imágenes */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full overflow-hidden rounded-2xl border bg-muted/30">
            <img 
              src={p.imagenes[imgSelected]?.url || '/images/default.svg'} 
              alt={p.nombre} 
              className="w-full h-full object-cover transition-all hover:scale-105" 
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {p.imagenes.map((img, i) => (
              <button 
                key={img.id || i} 
                onClick={() => setImgSelected(i)} 
                className={cn(
                  "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                  imgSelected === i ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <img src={img.url || '/images/default.svg'} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Información del Producto */}
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
              Nuevo Ingreso
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">{p.nombre}</h1>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold text-primary">S/ {Number(p.precioOferta || p.precioVenta).toFixed(2)}</p>
              {p.precioOferta && (
                <p className="text-lg text-muted-foreground line-through decoration-rose-500/50">
                  S/ {Number(p.precioVenta).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Descripción</h3>
            <p className="text-muted-foreground leading-relaxed">
              {p.descripcionCorta || 'Este producto es parte de nuestra selección exclusiva. Calidad garantizada en cada detalle.'}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                stockDisponible > 0 ? "bg-emerald-500" : "bg-rose-500"
              )} />
              <p className="text-sm font-bold">
                {stockDisponible > 0 
                  ? `${stockDisponible} unidades disponibles` 
                  : 'Agotado temporalmente'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="flex-1 h-12 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all" 
                onClick={handleAdd} 
                disabled={limiteAlcanzado}
              >
                {stockDisponible <= 0 ? 'Notificar Disponibilidad' : limiteAlcanzado ? 'Límite alcanzado' : 'Agregar al Carrito'}
              </Button>
              <Link to="/carrito" className="flex-1 sm:flex-none">
                <Button variant="outline" size="lg" className="w-full h-12 font-bold active:scale-95 transition-all">
                  Ver Carrito
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}