import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ordenService } from '@/services/orden.service';
import { carritoService } from '@/services/carrito.service';
import { getApiErrorMessage } from '@/lib/apiError';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function Checkout() {
  const queryClient = useQueryClient();
  const { items, clearCart, getTotal } = useCartStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [direccionEnvio, setDireccionEnvio] = useState({
    nombreReceptor: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    telefonoReceptor: '',
  });

  const [metodoEnvio, setMetodoEnvio] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [metodoPago, setMetodoPago] = useState<'TARJETA' | 'TRANSFERENCIA' | 'CONTRA_ENTREGA'>('TARJETA');

  const METODO_ENVIO_ID_STANDARD = '11111111-1111-1111-1111-111111111111';
  const METODO_ENVIO_ID_EXPRESS = '22222222-2222-2222-2222-222222222222';

  const costoEnvio = metodoEnvio === 'EXPRESS' ? 15 : 0;
  const subtotal = getTotal();
  const igv = subtotal * 0.18;
  const totalFinal = subtotal + igv + costoEnvio;

  const handlePay = async () => {
    setLoading(true);

    // Capturamos los items actuales para enviarlos si es necesario o asegurar su persistencia
    const currentItems = [...items];

    try {
      // 1. Verificar carrito antes de proceder
      if (currentItems.length === 0) {
        toast.error('El carrito está vacío');
        setLoading(false);
        return;
      }

      // 2. Sincronizar con el backend antes de crear la orden
      // Primero vaciamos el carrito del backend para asegurar consistencia
      await carritoService.vaciarCarrito();

      // Agregamos los items actuales al backend
      for (const item of currentItems) {
        await carritoService.agregarItem(item.productoId, item.cantidad);
      }

      // 3. Crear la orden
      await ordenService.crearOrden({
        metodoEnvioId: metodoEnvio === 'EXPRESS' ? METODO_ENVIO_ID_EXPRESS : METODO_ENVIO_ID_STANDARD,
        metodoPago,
        direccionEnvio,
      });

      // Invalidar queries para que se actualicen las listas y el dashboard
      queryClient.invalidateQueries({ queryKey: ['ordenes-admin'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['mis-ordenes'] });

      clearCart();
      toast.success('¡Compra realizada con éxito!');
      navigate('/mis-ordenes');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Error al procesar orden'));
    } finally {
      setLoading(false);
    }
  };

  const canGoNextFromStep1 = items.length > 0;
  const canGoNextFromStep2 = !!direccionEnvio.nombreReceptor && !!direccionEnvio.direccion && !!direccionEnvio.ciudad && !!direccionEnvio.departamento && !!direccionEnvio.telefonoReceptor;
  const canGoNextFromStep3 = !!metodoEnvio;
  const canGoNextFromStep4 = !!metodoPago;

  const nextDisabled =
    (step === 1 && !canGoNextFromStep1) ||
    (step === 2 && !canGoNextFromStep2) ||
    (step === 3 && !canGoNextFromStep3) ||
    (step === 4 && !canGoNextFromStep4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Finalizar Compra</h1>
          <p className="text-muted-foreground">Completa tus datos para procesar el envío de tu pedido.</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-bold">Paso {step} de 5</div>
          <div className="text-xs text-muted-foreground font-medium">
            {step === 1 ? 'Resumen' : step === 2 ? 'Dirección' : step === 3 ? 'Envío' : step === 4 ? 'Pago' : 'Confirmación'}
          </div>
        </div>

        <div className="space-y-8">
          {step === 1 && (
            <div className="border rounded-2xl p-6 md:p-8 bg-card shadow-sm ring-1 ring-border/50 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="font-bold text-lg">Resumen del Carrito</h2>
              </div>

              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground">Tu carrito está vacío.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((it) => (
                    <div key={it.productoId} className="flex items-center justify-between gap-4 border rounded-xl p-3 bg-background">
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{it.nombre}</div>
                        <div className="text-xs text-muted-foreground">Cant: {it.cantidad}</div>
                      </div>
                      <div className="text-sm font-bold tabular-nums">S/ {(it.precioUnitario * it.cantidad).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="border rounded-2xl p-6 md:p-8 bg-card shadow-sm ring-1 ring-border/50 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="font-bold text-lg">Dirección de Envío</h2>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nombre Completo</label>
                  <Input
                    value={direccionEnvio.nombreReceptor}
                    onChange={(e) => setDireccionEnvio((p) => ({ ...p, nombreReceptor: e.target.value }))}
                    required
                    placeholder="Ej. Juan Pérez"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Dirección Exacta</label>
                  <Input
                    value={direccionEnvio.direccion}
                    onChange={(e) => setDireccionEnvio((p) => ({ ...p, direccion: e.target.value }))}
                    required
                    placeholder="Av. Principal 123, Dpto 402"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Ciudad</label>
                    <Input
                      value={direccionEnvio.ciudad}
                      onChange={(e) => setDireccionEnvio((p) => ({ ...p, ciudad: e.target.value }))}
                      required
                      placeholder="Lima"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Departamento</label>
                    <Input
                      value={direccionEnvio.departamento}
                      onChange={(e) => setDireccionEnvio((p) => ({ ...p, departamento: e.target.value }))}
                      required
                      placeholder="Lima"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Teléfono de Contacto</label>
                  <Input
                    value={direccionEnvio.telefonoReceptor}
                    onChange={(e) => setDireccionEnvio((p) => ({ ...p, telefonoReceptor: e.target.value }))}
                    required
                    placeholder="987654321"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="border rounded-2xl p-6 md:p-8 bg-card shadow-sm ring-1 ring-border/50 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="font-bold text-lg">Método de Envío</h2>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setMetodoEnvio('STANDARD')}
                  className={`text-left border rounded-xl p-4 bg-background transition-colors ${metodoEnvio === 'STANDARD' ? 'border-primary ring-1 ring-primary/20' : 'hover:bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">Envío estándar</div>
                      <div className="text-xs text-muted-foreground">3-5 días hábiles</div>
                    </div>
                    <div className="font-bold">S/ 0.00</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoEnvio('EXPRESS')}
                  className={`text-left border rounded-xl p-4 bg-background transition-colors ${metodoEnvio === 'EXPRESS' ? 'border-primary ring-1 ring-primary/20' : 'hover:bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">Envío express</div>
                      <div className="text-xs text-muted-foreground">24-48 horas</div>
                    </div>
                    <div className="font-bold">S/ 15.00</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="border rounded-2xl p-6 md:p-8 bg-card shadow-sm ring-1 ring-border/50 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">4</div>
                <h2 className="font-bold text-lg">Método de Pago</h2>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setMetodoPago('TARJETA')}
                  className={`text-left border rounded-xl p-4 bg-background transition-colors ${metodoPago === 'TARJETA' ? 'border-primary ring-1 ring-primary/20' : 'hover:bg-muted/30'}`}
                >
                  <div className="font-bold">Tarjeta</div>
                  <div className="text-xs text-muted-foreground">Pago inmediato</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                  className={`text-left border rounded-xl p-4 bg-background transition-colors ${metodoPago === 'TRANSFERENCIA' ? 'border-primary ring-1 ring-primary/20' : 'hover:bg-muted/30'}`}
                >
                  <div className="font-bold">Transferencia</div>
                  <div className="text-xs text-muted-foreground">Validación manual</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('CONTRA_ENTREGA')}
                  className={`text-left border rounded-xl p-4 bg-background transition-colors ${metodoPago === 'CONTRA_ENTREGA' ? 'border-primary ring-1 ring-primary/20' : 'hover:bg-muted/30'}`}
                >
                  <div className="font-bold">Contra entrega</div>
                  <div className="text-xs text-muted-foreground">Paga al recibir</div>
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="border rounded-2xl p-6 md:p-8 bg-card shadow-sm ring-1 ring-border/50 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">5</div>
                <h2 className="font-bold text-lg">Confirmación</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="border rounded-xl p-4 bg-background">
                  <div className="font-bold mb-2">Envío</div>
                  <div className="text-muted-foreground">
                    {direccionEnvio.nombreReceptor} · {direccionEnvio.telefonoReceptor}
                  </div>
                  <div className="text-muted-foreground">
                    {direccionEnvio.direccion} · {direccionEnvio.ciudad}, {direccionEnvio.departamento}
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    Método: {metodoEnvio === 'EXPRESS' ? 'Express' : 'Estándar'}
                  </div>
                </div>

                <div className="border rounded-xl p-4 bg-background">
                  <div className="font-bold mb-2">Pago</div>
                  <div className="text-muted-foreground">
                    {metodoPago === 'TARJETA' ? 'Tarjeta' : metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Contra entrega'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border rounded-2xl p-6 md:p-8 bg-primary/5 border-primary/10 space-y-6">
            <div className="flex items-center justify-between border-b border-primary/10 pb-4">
              <span className="font-bold text-primary">Total Final</span>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary tracking-tight">
                  S/ {totalFinal.toFixed(2)}
                </p>
                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Envío incluido</p>
              </div>
            </div>

            <div className="text-[11px] text-primary/70 font-medium space-y-1">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-bold">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>IGV (18%)</span>
                <span className="font-bold">S/ {igv.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Envío</span>
                <span className="font-bold">S/ {costoEnvio.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 text-base font-bold"
                disabled={loading || step === 1}
                onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as any)))}
              >
                Atrás
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  className="flex-1 h-12 text-base font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                  disabled={loading || nextDisabled}
                  onClick={() => setStep((s) => ((s + 1) as any))}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  type="button"
                  className="flex-1 h-12 text-base font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                  disabled={loading || items.length === 0}
                  onClick={handlePay}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Procesando...
                    </div>
                  ) : (
                    'Confirmar y Pagar Ahora'
                  )}
                </Button>
              )}
            </div>

            <p className="text-[11px] text-center text-primary/60 font-medium">
              Pago 100% seguro procesado de forma encriptada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}