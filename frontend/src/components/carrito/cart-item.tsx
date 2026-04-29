import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { carritoService } from '@/services/carrito.service';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { ItemCarrito } from '@/types';
import { Trash2, Minus, Plus, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  item: ItemCarrito;
}

export default function CartItem({ item }: Props) {
  const { removeItem, addItem } = useCartStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const stockDisponible = item.stockDisponible ?? 0;
  const limiteAlcanzado = item.cantidad >= stockDisponible;

  const handleRemove = async () => {
    removeItem(item.productoId);
    if (accessToken) {
      try {
        await carritoService.eliminarItem(item.productoId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Error al eliminar item del carrito'));
      }
    }
  };

  const handleUpdateQuantity = async (delta: number) => {
    if (delta === 1) {
      if (limiteAlcanzado) {
        toast.error('Llegaste al límite de stock disponible');
        return;
      }
      addItem({ ...item, cantidad: 1 });
      if (accessToken) {
        try {
          await carritoService.agregarItem(item.productoId, 1);
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'Error al actualizar cantidad'));
        }
      }
    } else {
      if (item.cantidad <= 1) {
        handleRemove();
      } else {
        removeItem(item.productoId);
        addItem({ ...item, cantidad: item.cantidad - 1 });
        if (accessToken) {
          try {
            await carritoService.eliminarItem(item.productoId);
            await carritoService.agregarItem(item.productoId, item.cantidad - 1);
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Error al actualizar cantidad'));
          }
        }
      }
    }
  };

  return (
    <div className="group flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-6 rounded-2xl border bg-card/50 dark:bg-card/20 backdrop-blur-sm hover:border-primary/20 dark:hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Imagen */}
      <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-xl bg-muted dark:bg-muted/50">
        <img 
          src={item.imagenUrl || '/images/default.svg'} 
          alt={item.nombre} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
      </div>
      
      {/* Info */}
      <div className="flex-grow flex flex-col gap-1 w-full text-center sm:text-left">
        <h3 className="font-bold text-base line-clamp-2 hover:text-primary transition-colors">{item.nombre}</h3>
        <p className="text-sm font-semibold text-primary">S/ {Number(item.precioUnitario).toFixed(2)}</p>
        
        {stockDisponible <= 5 && stockDisponible > 0 && (
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit mx-auto sm:mx-0 mt-1">
            <Info className="h-3 w-3" />
            Solo {stockDisponible} disponibles
          </div>
        )}
      </div>

      {/* Controles y Precio */}
      <div className="flex flex-row items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-border/50 dark:border-primary/10">
        <div className="flex items-center gap-3 bg-muted/50 dark:bg-muted/10 p-1 rounded-xl border border-border/50 dark:border-primary/10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg hover:bg-background dark:hover:bg-muted/50" 
            onClick={() => handleUpdateQuantity(-1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm font-black">{item.cantidad}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg hover:bg-background dark:hover:bg-muted/50" 
            onClick={() => handleUpdateQuantity(1)} 
            disabled={limiteAlcanzado}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex flex-col items-end gap-1 min-w-[100px]">
          <span className="text-lg font-black tracking-tight">
            S/ {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 -mr-2" 
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="text-xs font-bold uppercase">Quitar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
