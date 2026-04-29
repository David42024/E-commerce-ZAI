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
import { ShoppingCart, Share2, Heart, Truck, ShieldCheck, Package } from 'lucide-react';

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
        <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Cargando detalles del producto...</p>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Breadcrumbs */}
      <nav className="flex mb-8 text-sm font-medium" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/catalogo" className="text-muted-foreground hover:text-foreground transition-colors">Catálogo</Link>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground truncate max-w-[200px]">{p.nombre}</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
        {/* Galería de Imágenes */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="aspect-[4/5] sm:aspect-square w-full overflow-hidden rounded-3xl border dark:border-primary/10 bg-muted/30 dark:bg-muted/5 relative group">
            <img 
              src={p.imagenes[imgSelected]?.url || '/images/default.svg'} 
              alt={p.nombre} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
            {p.precioOferta && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-destructive text-destructive-foreground font-bold px-3 py-1 text-sm">OFERTA</Badge>
              </div>
            )}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button variant="secondary" size="icon" className="rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity dark:bg-muted dark:hover:bg-muted/80">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" className="rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity dark:bg-muted dark:hover:bg-muted/80">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {p.imagenes.map((img, i) => (
              <button 
                key={img.id || i} 
                onClick={() => setImgSelected(i)} 
                className={cn(
                  "relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200",
                  imgSelected === i ? "border-primary scale-95 shadow-lg shadow-primary/20" : "border-transparent hover:border-muted-foreground/30 opacity-70 hover:opacity-100 dark:hover:border-primary/20"
                )}
              >
                <img src={img.url || '/images/default.svg'} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Información del Producto */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {p.categoria && (
                <Badge variant="secondary" className="font-semibold text-xs dark:bg-muted dark:text-muted-foreground">{p.categoria.nombre}</Badge>
              )}
              {p.marca && (
                <Badge variant="outline" className="font-semibold text-xs border-primary/20 text-primary dark:border-primary/40 dark:text-primary">{p.marca.nombre}</Badge>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{p.nombre}</h1>
            <p className="text-sm text-muted-foreground font-medium">SKU: {p.sku}</p>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex flex-col">
                <span className="text-4xl font-black text-primary tracking-tighter">S/ {Number(p.precioOferta || p.precioVenta).toFixed(2)}</span>
                {p.precioOferta && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-muted-foreground line-through decoration-destructive/50">S/ {Number(p.precioVenta).toFixed(2)}</span>
                    <span className="text-xs font-bold text-destructive bg-destructive/10 dark:bg-destructive/20 px-1.5 py-0.5 rounded">
                      -{Math.round((1 - p.precioOferta / p.precioVenta) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-muted/30 dark:bg-muted/5 rounded-3xl border border-border/50 dark:border-primary/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-2.5 w-2.5 rounded-full animate-pulse",
                stockDisponible > 0 ? "bg-emerald-500" : "bg-rose-500"
              )} />
              <p className="text-sm font-bold flex items-center gap-1.5">
                <Package className="h-4 w-4 text-muted-foreground" />
                {stockDisponible > 0 
                  ? `${stockDisponible} unidades disponibles` 
                  : 'Agotado temporalmente'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all rounded-2xl" 
                onClick={handleAdd} 
                disabled={limiteAlcanzado}
              >
                {stockDisponible <= 0 ? 'Notificar disponibilidad' : limiteAlcanzado ? 'Límite alcanzado' : 'Añadir al carrito'}
                <ShoppingCart className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/carrito" className="w-full">
                <Button variant="outline" size="lg" className="w-full h-12 font-bold rounded-2xl hover:bg-muted dark:hover:bg-muted/50 transition-colors">
                  Ir al carrito
                </Button>
              </Link>
            </div>
          </div>

          {/* Beneficios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/50 dark:border-primary/10">
              <Truck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold">Envío Express</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 text-pretty">Recíbelo en 24-48 horas en todo el país.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/50 dark:border-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold">Compra Segura</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 text-pretty">Garantía oficial y pagos 100% cifrados.</p>
              </div>
            </div>
          </div>

          {/* Tabs/Accordion simple para descripción */}
          <div className="space-y-6 pt-4">
            <div className="border-b dark:border-primary/10 pb-2">
              <h3 className="font-black text-lg">Descripción</h3>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground dark:text-muted-foreground/80 leading-relaxed">
              {p.descripcionLarga || p.descripcionCorta || 'No hay una descripción detallada disponible para este producto.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
