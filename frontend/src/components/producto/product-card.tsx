import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { carritoService } from '@/services/carrito.service';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { Producto } from '@/types';
import toast from 'react-hot-toast';

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
    <div className="border rounded-lg overflow-hidden flex flex-col h-full bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img 
          src={producto.imagenes[0]?.url || 'https://placehold.co/300x300?text=Sin+Imagen'} 
          alt={producto.nombre} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        {tieneDescuento && (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
            OFERTA
          </span>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{producto.nombre}</h3>
        
        <div className="mt-auto pt-4 border-t">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              S/ {precioFinal.toFixed(2)}
            </span>
            {tieneDescuento && (
              <span className="text-xs text-muted-foreground line-through">
                S/ {Number(producto.precioVenta).toFixed(2)}
              </span>
            )}
          </div>
          
          <Button 
            className="w-full mt-3" 
            size="sm" 
            onClick={handleAdd}
            disabled={limiteAlcanzado}
          >
            {stockDisponible <= 0 ? 'Agotado' : limiteAlcanzado ? 'Límite alcanzado' : 'Agregar al carrito'}
          </Button>
        </div>
      </div>
    </div>
  );
};