import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { carritoService } from '@/services/carrito.service';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { ItemCarrito } from '@/types';
import { Trash2, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  item: ItemCarrito;
}

export default function CartItem({ item }: Props) {
  const { removeItem, addItem } = useCartStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const limiteAlcanzado = typeof item.stockDisponible === 'number' && item.cantidad >= item.stockDisponible;

  const handleRemove = async () => {
    removeItem(item.productoId);
    if (accessToken) {
      try {
        await carritoService.eliminarItem(item.productoId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Error al eliminar item del carrito'));
        console.error('Error al eliminar item:', error);
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
          toast.error(getApiErrorMessage(error, 'Error al agregar item al carrito'));
          console.error('Error al agregar item:', error);
        }
      }
    } else {
      if (item.cantidad <= 1) {
        handleRemove();
      } else {
        // En el store local, addItem con cantidad negativa o algo así no funciona bien por la lógica de "existing"
        // Así que usamos la lógica que ya estaba de remove + add
        removeItem(item.productoId);
        addItem({ ...item, cantidad: item.cantidad - 1 });
        
        if (accessToken) {
          try {
            // El backend usualmente tiene un "update" o "set", pero aquí agregarItem parece ser un "add"
            // Si el backend agregarItem suma a la cantidad existente, entonces para restar tendríamos que 
            // tener un endpoint de restar o simplemente reenviar el carrito.
            // Mirando carritoService, solo tiene agregarItem(productoId, cantidad).
            // Vamos a asumir que agregarItem con cantidad negativa funciona o que el backend sobreescribe.
            // Si no, tendríamos que vaciar y resincronizar, o usar un endpoint de "remover cantidad".
            // Por ahora, usemos eliminarItem y luego agregarItem con la nueva cantidad para asegurar.
            await carritoService.eliminarItem(item.productoId);
            await carritoService.agregarItem(item.productoId, item.cantidad - 1);
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Error al actualizar cantidad del carrito'));
            console.error('Error al actualizar cantidad:', error);
          }
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-4 border p-4 rounded-lg bg-card">
      <img src={item.imagenUrl || '/images/default.svg'} alt={item.nombre} className="w-20 h-20 object-cover rounded-md bg-muted" />
      
      <div className="flex-grow">
        <h3 className="font-semibold text-sm line-clamp-1">{item.nombre}</h3>
        <p className="text-xs text-muted-foreground">Precio unitario: S/ {Number(item.precioUnitario).toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateQuantity(-1)}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center font-medium">{item.cantidad}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateQuantity(1)} disabled={limiteAlcanzado}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <p className="font-bold text-right w-24">S/ {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}</p>
      
      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}