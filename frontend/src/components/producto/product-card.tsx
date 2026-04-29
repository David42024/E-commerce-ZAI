import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { carritoService } from '@/services/carrito.service';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { Producto } from '@/types';
import toast from 'react-hot-toast';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { clsx } from 'clsx';

interface Props {
  producto: Producto;
}

export const ProductCard = ({ producto }: Props) => {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const accessToken = useAuthStore((s) => s.accessToken);

  const precioVentaNum = Number(producto.precioVenta);
  const precioOfertaNum = producto.precioOferta === null || producto.precioOferta === undefined
    ? null
    : Number(producto.precioOferta);

  const tieneDescuento = precioOfertaNum !== null && !Number.isNaN(precioOfertaNum) && precioOfertaNum > 0;
  const precioFinal = tieneDescuento ? precioOfertaNum : precioVentaNum;
  const stockDisponible = (producto.stock?.stockFisico ?? 0) - (producto.stock?.stockReservado ?? 0);
  const cantidadEnCarrito = items.find((i) => i.productoId === producto.id)?.cantidad || 0;
  const limiteAlcanzado = stockDisponible <= 0 || cantidadEnCarrito >= stockDisponible;

  const handleAdd = async () => {
    if (limiteAlcanzado) {
      toast.error('Llegaste al límite de stock disponible');
      return;
    }

    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precioUnitario: precioFinal,
      cantidad: 1,
      imagenUrl: producto.imagenes[0]?.url || '',
      stockDisponible,
    });

    // Sincronizar con backend si está logueado
    if (accessToken) {
      try {
        await carritoService.agregarItem(producto.id, 1);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Error al agregar producto al carrito'));
        console.error('Error al sincronizar carrito:', error);
      }
    }

    toast.success(`${producto.nombre} agregado al carrito`);
  };

  return (
    <div className="group border dark:border-primary/10 rounded-xl overflow-hidden flex flex-col h-full bg-card dark:bg-card/50 shadow-sm hover:shadow-xl dark:hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-muted dark:bg-muted/50">
        <img 
          src={producto.imagenes[0]?.url || '/images/default.svg'} 
          alt={producto.nombre} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {tieneDescuento && (
            <Badge className="bg-destructive text-destructive-foreground font-bold shadow-sm">
              OFERTA
            </Badge>
          )}
          {stockDisponible <= 5 && stockDisponible > 0 && (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 font-bold backdrop-blur-sm">
              Últimas {stockDisponible} un.
            </Badge>
          )}
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Link to={`/producto/${producto.id}`}>
            <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform dark:bg-muted dark:hover:bg-muted/80">
              <Eye className="h-5 w-5" />
            </Button>
          </Link>
          <Button 
            size="icon" 
            variant="default" 
            className="rounded-full h-10 w-10 shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform delay-75"
            onClick={handleAdd}
            disabled={limiteAlcanzado}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Link to={`/producto/${producto.id}`} className="hover:text-primary transition-colors">
            <h3 className="font-bold text-base line-clamp-2">{producto.nombre}</h3>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Package className="h-3.5 w-3.5" />
          <span>Stock disponible: </span>
          <span className={clsx("font-bold", stockDisponible <= 0 ? "text-destructive" : "text-foreground dark:text-foreground/90")}>
            {stockDisponible > 0 ? stockDisponible : 'Agotado'}
          </span>
        </div>
        
        <div className="mt-auto pt-4 border-t dark:border-primary/10 flex items-center justify-between">
          <div className="flex flex-col">
            {tieneDescuento && (
              <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                S/ {Number(producto.precioVenta).toFixed(2)}
              </span>
            )}
            <span className="text-xl font-black text-foreground dark:text-primary tracking-tighter">
              S/ {precioFinal.toFixed(2)}
            </span>
          </div>
          
          <Button 
            size="sm" 
            className="rounded-full px-4 font-bold shadow-md hover:shadow-primary/20 active:scale-95 transition-all"
            onClick={handleAdd}
            disabled={limiteAlcanzado}
          >
            {stockDisponible <= 0 ? 'Agotado' : 'Agregar'}
          </Button>
        </div>
      </div>
    </div>
  );
};