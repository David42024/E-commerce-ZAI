import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { carritoService } from '@/services/carrito.service';
import CartItem from '@/components/carrito/cart-item';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Carrito() {
  const { items, clearCart, getTotal, setItemStockDisponible } = useCartStore();
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: carritoBackend } = useQuery({
    queryKey: ['mi-carrito-stock-limits'],
    queryFn: () => carritoService.getMiCarrito(),
    enabled: !!accessToken,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!carritoBackend?.data?.items?.length) return;

    for (const item of carritoBackend.data.items) {
      const stockDisponible = (item.producto?.stock?.stockFisico ?? 0) - (item.producto?.stock?.stockReservado ?? 0);
      setItemStockDisponible(item.productoId, stockDisponible);
    }
  }, [carritoBackend, setItemStockDisponible]);

  const handleClearCart = async () => {
    clearCart();
    if (accessToken) {
      try {
        await carritoService.vaciarCarrito();
      } catch (error) {
        console.error('Error al vaciar carrito:', error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Carrito</h1>
          <p className="text-muted-foreground">{items.length} {items.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}</p>
        </div>
        {items.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearCart}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors font-medium"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Vaciar Carrito
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-muted/20">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
            <Trash2 className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-bold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-8 max-w-xs">Parece que aún no has agregado productos a tu selección.</p>
          <Link to="/catalogo">
            <Button size="lg" className="px-8 font-bold active:scale-95 transition-all">
              Ir al Catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem key={item.productoId} item={item} />
            ))}
          </div>

          <div className="space-y-6 h-fit sticky top-24">
            <div className="border rounded-2xl p-6 bg-card shadow-sm ring-1 ring-border/50">
              <h2 className="text-lg font-bold mb-6">Resumen de Compra</h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal:</span>
                  <span className="font-bold">S/ {getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">IGV (18%):</span>
                  <span className="font-bold text-muted-foreground">S/ {(getTotal() * 0.18).toFixed(2)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold">Total:</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary tracking-tight">
                      S/ {(getTotal() * 1.18).toFixed(2)}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Incluye impuestos</p>
                  </div>
                </div>
              </div>
              <Link to="/checkout" className="block mt-8">
                <Button className="w-full h-12 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all" size="lg">
                  Proceder al Pago
                </Button>
              </Link>
            </div>
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <p className="text-xs text-primary/80 leading-relaxed font-medium">
                Al proceder al pago, aceptas nuestros términos de servicio y políticas de privacidad.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}