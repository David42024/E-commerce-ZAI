import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { carritoService } from '@/services/carrito.service';
import CartItem from '@/components/carrito/cart-item';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
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

  const subtotal = getTotal();
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-black uppercase tracking-widest">Tu Selección</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Mi Carrito</h1>
          <p className="text-muted-foreground font-medium">
            Tienes {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu bolsa
          </p>
        </div>
        {items.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearCart}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors font-bold uppercase tracking-tighter"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Vaciar Carrito
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-[2rem] bg-muted/20 dark:bg-muted/5 border-border/50 dark:border-primary/10">
          <div className="h-20 w-20 bg-muted dark:bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-2xl font-black mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-8 max-w-xs font-medium">Parece que aún no has agregado nada. ¡Explora nuestras novedades!</p>
          <Link to="/catalogo">
            <Button size="lg" className="px-10 h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all">
              Explorar Catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Lista de Items */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <CartItem key={item.productoId} item={item} />
              ))}
            </div>
            
            {/* Beneficios rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 dark:bg-muted/5 border border-border/50 dark:border-primary/10">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-tighter">Envío Gratis*</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 dark:bg-muted/5 border border-border/50 dark:border-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-tighter">Pago Seguro</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 dark:bg-muted/5 border border-border/50 dark:border-primary/10">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-tighter">Devolución 30 días</span>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            <div className="relative overflow-hidden border rounded-[2rem] p-8 bg-card dark:bg-card/50 shadow-2xl shadow-primary/5 ring-1 ring-border/50 dark:ring-primary/10">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-primary/5 dark:bg-primary/10 rounded-full blur-2xl" />
              
              <h2 className="text-xl font-black mb-8 flex items-center gap-2">
                Resumen de Compra
              </h2>
              
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold text-sm">Subtotal</span>
                  <span className="font-black">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold text-sm">IGV (18%)</span>
                  <span className="font-bold text-muted-foreground text-sm">S/ {igv.toFixed(2)}</span>
                </div>
                
                <div className="h-px bg-gradient-to-r from-transparent via-border dark:via-primary/10 to-transparent my-2" />
                
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-lg font-black uppercase tracking-tighter">Total</span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Incluye impuestos</span>
                  </div>
                  <span className="text-3xl font-black text-primary tracking-tighter">
                    S/ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/checkout" className="block mt-10 group">
                <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 group-hover:shadow-primary/30 active:scale-[0.98] transition-all" size="lg">
                  Finalizar Compra
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              {/* Promo code mock */}
              <div className="mt-8 pt-6 border-t border-dashed border-border dark:border-primary/20">
                <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">¿Tienes un cupón?</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Código de descuento" 
                    className="flex-1 bg-muted/50 dark:bg-muted/20 border-none rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none h-10"
                  />
                  <Button variant="outline" className="rounded-xl h-10 font-bold px-4">Aplicar</Button>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20">
              <p className="text-[10px] text-center text-primary/60 leading-relaxed font-black uppercase tracking-widest">
                Garantía de satisfacción total en todas tus compras
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
