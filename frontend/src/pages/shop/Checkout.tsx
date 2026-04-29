import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ordenService } from '@/services/orden.service';
import { carritoService } from '@/services/carrito.service';
import { clienteService } from '@/services/cliente.service';
import { getApiErrorMessage } from '@/lib/apiError';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  ShoppingBag, 
  ShieldCheck,
  CreditCard as CardIcon,
  Smartphone,
  Banknote,
  Info,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Checkout() {
  const queryClient = useQueryClient();
  const { items, clearCart, getTotal } = useCartStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [perfil, setPerfil] = useState<any>(null);

  const [direccionEnvio, setDireccionEnvio] = useState({
    nombreReceptor: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    telefonoReceptor: '',
  });

  const [metodoEnvio, setMetodoEnvio] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [metodoPago, setMetodoPago] = useState<'TARJETA' | 'TRANSFERENCIA' | 'CONTRA_ENTREGA' | 'CREDITO'>('TARJETA');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Estado para el formulario de tarjeta "realista"
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  });

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await clienteService.getPerfil();
        setPerfil(res.data);
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      }
    };
    fetchPerfil();
  }, []);

  const METODO_ENVIO_ID_STANDARD = '11111111-1111-1111-1111-111111111111';
  const METODO_ENVIO_ID_EXPRESS = '22222222-2222-2222-2222-222222222222';

  const costoEnvio = metodoEnvio === 'EXPRESS' ? 15 : 0;
  const subtotal = getTotal();
  const igv = subtotal * 0.18;
  const totalFinal = subtotal + igv + costoEnvio;

  const creditoDisponible = perfil ? (Number(perfil.limiteCredito) - Number(perfil.saldoDeudor)) : 0;

  const handlePay = async () => {
    if (metodoPago === 'TARJETA' && (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvc)) {
      toast.error('Por favor completa los datos de tu tarjeta');
      return;
    }

    if (metodoPago === 'CREDITO' && totalFinal > creditoDisponible) {
      toast.error('Crédito insuficiente para realizar esta compra');
      return;
    }

    setLoading(true);
    setPaymentProcessing(true);

    try {
      if (items.length === 0) {
        toast.error('El carrito está vacío');
        setLoading(false);
        setPaymentProcessing(false);
        return;
      }

      // 1. Simular procesamiento inicial
      setProcessingStatus('Validando orden...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // 2. Sincronizar carrito con el backend de forma eficiente
      setProcessingStatus('Sincronizando productos...');
      await carritoService.vaciarCarrito();
      await Promise.all(items.map(item => 
        carritoService.agregarItem(item.productoId, item.cantidad)
      ));

      // 3. Simular procesamiento de pago según el método
      if (metodoPago === 'TARJETA') {
        setProcessingStatus('Conectando con pasarela bancaria...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProcessingStatus('Autorizando transacción...');
        await new Promise(resolve => setTimeout(resolve, 1200));
      } else if (metodoPago === 'CREDITO') {
        setProcessingStatus('Verificando línea de crédito...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        setProcessingStatus('Registrando pedido...');
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // 4. Crear la orden final
      setProcessingStatus('Finalizando compra...');
      await ordenService.crearOrden({
        metodoEnvioId: metodoEnvio === 'EXPRESS' ? METODO_ENVIO_ID_EXPRESS : METODO_ENVIO_ID_STANDARD,
        metodoPago,
        direccionEnvio,
        datosPago: metodoPago === 'TARJETA' ? {
          lastFour: cardData.number.slice(-4),
          brand: 'VISA',
        } : null
      });

      queryClient.invalidateQueries({ queryKey: ['ordenes-admin'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['mis-ordenes'] });
      queryClient.invalidateQueries({ queryKey: ['perfil'] });

      setStep(5);
      clearCart();
      toast.success('¡Compra realizada con éxito!', {
        icon: '🎉',
        duration: 5000
      });
      
      setTimeout(() => {
        navigate('/mis-ordenes');
      }, 3000);

    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Error al procesar la orden');
      toast.error(msg);
      // Si el error es de stock, podríamos redirigir al carrito o actualizarlo
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
      setProcessingStatus('');
    }
  };

  const steps = [
    { id: 1, label: 'Resumen', icon: ShoppingBag },
    { id: 2, label: 'Dirección', icon: MapPin },
    { id: 3, label: 'Envío', icon: Truck },
    { id: 4, label: 'Pago', icon: CreditCard },
    { id: 5, label: 'Confirmación', icon: CheckCircle2 },
  ];

  const canGoNextFromStep1 = items.length > 0;
  const canGoNextFromStep2 = !!direccionEnvio.nombreReceptor && !!direccionEnvio.direccion && !!direccionEnvio.ciudad && !!direccionEnvio.departamento && !!direccionEnvio.telefonoReceptor;
  const canGoNextFromStep3 = !!metodoEnvio;
  const canGoNextFromStep4 = metodoPago === 'TARJETA' ? (!!cardData.number && !!cardData.name) : !!metodoPago;

  const nextDisabled =
    (step === 1 && !canGoNextFromStep1) ||
    (step === 2 && !canGoNextFromStep2) ||
    (step === 3 && !canGoNextFromStep3) ||
    (step === 4 && !canGoNextFromStep4);

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Stepper */}
            <nav className="mb-12">
              <ol className="flex items-center justify-between w-full">
                {steps.map((s, idx) => (
                  <li key={s.id} className={cn(
                    "relative flex flex-col items-center flex-1",
                    idx !== steps.length - 1 && "after:content-[''] after:w-full after:h-0.5 after:bg-border after:absolute after:top-5 after:left-1/2 after:-z-10",
                    s.id < step && "after:bg-primary dark:after:bg-primary/50"
                  )}>
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                      s.id === step ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20 dark:ring-primary/10 shadow-lg" : 
                      s.id < step ? "bg-primary text-primary-foreground" : "bg-card dark:bg-muted/50 text-muted-foreground border dark:border-primary/20"
                    )}>
                      {s.id < step ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest mt-3 transition-colors",
                      s.id === step ? "text-primary" : "text-muted-foreground"
                    )}>
                      {s.label}
                    </span>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Step Content */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {step === 1 && (
                <div className="bg-card dark:bg-card/50 rounded-[2rem] border dark:border-primary/10 p-8 shadow-sm">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                    Revisa tu pedido
                  </h2>
                  <div className="space-y-4">
                    {items.map((it) => (
                      <div key={it.productoId} className="flex items-center gap-4 p-4 rounded-2xl border dark:border-primary/5 bg-muted/20 dark:bg-muted/10">
                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-background border dark:border-primary/10 flex-shrink-0">
                          <img src={it.imagenUrl || '/images/default.svg'} alt={it.nombre} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{it.nombre}</h4>
                          <p className="text-xs text-muted-foreground font-medium">Cantidad: {it.cantidad}</p>
                        </div>
                        <div className="text-sm font-black text-right">
                          S/ {(it.precioUnitario * it.cantidad).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-card dark:bg-card/50 rounded-[2rem] border dark:border-primary/10 p-8 shadow-sm">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-primary" />
                    ¿A dónde lo enviamos?
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre del receptor</label>
                      <Input
                        value={direccionEnvio.nombreReceptor}
                        onChange={(e) => setDireccionEnvio((p) => ({ ...p, nombreReceptor: e.target.value }))}
                        placeholder="Nombre y apellido"
                        className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dirección de entrega</label>
                      <Input
                        value={direccionEnvio.direccion}
                        onChange={(e) => setDireccionEnvio((p) => ({ ...p, direccion: e.target.value }))}
                        placeholder="Calle, número, dpto, urbanización"
                        className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ciudad / Distrito</label>
                      <Input
                        value={direccionEnvio.ciudad}
                        onChange={(e) => setDireccionEnvio((p) => ({ ...p, ciudad: e.target.value }))}
                        placeholder="Ej: Trujillo"
                        className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Departamento</label>
                      <Input
                        value={direccionEnvio.departamento}
                        onChange={(e) => setDireccionEnvio((p) => ({ ...p, departamento: e.target.value }))}
                        placeholder="Ej: La Libertad"
                        className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Teléfono</label>
                      <Input
                        value={direccionEnvio.telefonoReceptor}
                        onChange={(e) => setDireccionEnvio((p) => ({ ...p, telefonoReceptor: e.target.value }))}
                        placeholder="999 999 999"
                        className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="bg-card dark:bg-card/50 rounded-[2rem] border dark:border-primary/10 p-8 shadow-sm">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <Truck className="h-6 w-6 text-primary" />
                    Elige el envío
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setMetodoEnvio('STANDARD')}
                      className={cn(
                        "text-left p-6 rounded-3xl border-2 transition-all duration-300 relative group",
                        metodoEnvio === 'STANDARD' 
                          ? "border-primary bg-primary/5 dark:bg-primary/10" 
                          : "border-border dark:border-primary/10 hover:border-primary/50 bg-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-2xl", metodoEnvio === 'STANDARD' ? "bg-primary text-primary-foreground" : "bg-muted dark:bg-muted/50")}>
                          <Truck className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-black">S/ 0.00</span>
                      </div>
                      <h3 className="font-black text-lg">Estándar</h3>
                      <p className="text-sm text-muted-foreground font-medium">3 a 5 días hábiles</p>
                      {metodoEnvio === 'STANDARD' && <div className="absolute top-4 right-4 h-3 w-3 bg-primary rounded-full animate-pulse" />}
                    </button>

                    <button
                      onClick={() => setMetodoEnvio('EXPRESS')}
                      className={cn(
                        "text-left p-6 rounded-3xl border-2 transition-all duration-300 relative group",
                        metodoEnvio === 'EXPRESS' 
                          ? "border-primary bg-primary/5 dark:bg-primary/10" 
                          : "border-border dark:border-primary/10 hover:border-primary/50 bg-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-2xl", metodoEnvio === 'EXPRESS' ? "bg-primary text-primary-foreground" : "bg-muted dark:bg-muted/50")}>
                          <Truck className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-black">S/ 15.00</span>
                      </div>
                      <h3 className="font-black text-lg">Express</h3>
                      <p className="text-sm text-muted-foreground font-medium">24 a 48 horas</p>
                      {metodoEnvio === 'EXPRESS' && <div className="absolute top-4 right-4 h-3 w-3 bg-primary rounded-full animate-pulse" />}
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="bg-card dark:bg-card/50 rounded-[2rem] border dark:border-primary/10 p-8 shadow-sm">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    Método de pago
                  </h2>
                  
                  <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    {[
                      { id: 'TARJETA', label: 'Tarjeta', icon: CardIcon },
                      { id: 'TRANSFERENCIA', label: 'Transferencia', icon: Smartphone },
                      { id: 'CONTRA_ENTREGA', label: 'Efectivo', icon: Banknote },
                      ...(perfil && Number(perfil.limiteCredito) > 0 ? [{ id: 'CREDITO', label: 'Crédito', icon: Wallet }] : [])
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMetodoPago(m.id as any)}
                        className={cn(
                          "flex-1 min-w-[120px] flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                          metodoPago === m.id 
                            ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary" 
                            : "border-border dark:border-primary/10 hover:border-primary/30"
                        )}
                      >
                        <m.icon className="h-6 w-6" />
                        <span className="text-xs font-black uppercase tracking-widest">{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {metodoPago === 'CREDITO' && (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                      <div className={cn(
                        "p-6 rounded-3xl border-2 transition-all flex items-center justify-between",
                        totalFinal <= creditoDisponible 
                          ? "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10" 
                          : "bg-rose-500/5 border-rose-500/20 dark:bg-rose-500/10"
                      )}>
                        <div className="space-y-1">
                          <h4 className="font-black text-lg">Crédito Directo ZAI</h4>
                          <p className="text-sm text-muted-foreground font-medium">
                            Usa tu línea de crédito para esta compra
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Disponible</p>
                          <p className={cn(
                            "text-2xl font-black",
                            totalFinal <= creditoDisponible ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            S/ {creditoDisponible.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {totalFinal > creditoDisponible && (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                          <ShieldCheck className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 leading-relaxed">
                            Tu crédito disponible es insuficiente para cubrir el total de S/ {totalFinal.toFixed(2)}. 
                            Por favor elige otro método de pago o reduce tu pedido.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {metodoPago === 'TARJETA' && (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                      {/* Visual Card */}
                      <div className="relative h-48 w-full max-w-sm mx-auto rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 p-8 text-white shadow-2xl overflow-hidden ring-1 ring-white/10 dark:ring-white/5">
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                          <CardIcon className="h-24 w-24" />
                        </div>
                        <div className="h-10 w-14 bg-gradient-to-br from-amber-400 to-amber-200 rounded-lg mb-8 shadow-inner" />
                        <div className="space-y-4">
                          <div className="text-xl font-mono tracking-[0.2em]">
                            {cardData.number || '•••• •••• •••• ••••'}
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-[8px] uppercase tracking-widest opacity-50 font-bold">Titular</p>
                              <p className="text-xs font-black uppercase tracking-widest truncate max-w-[150px]">
                                {cardData.name || 'TU NOMBRE AQUÍ'}
                              </p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[8px] uppercase tracking-widest opacity-50 font-bold">Vence</p>
                              <p className="text-xs font-black font-mono">
                                {cardData.expiry || 'MM/YY'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Número de tarjeta</label>
                          <Input
                            value={cardData.number}
                            onChange={(e) => setCardData(p => ({ ...p, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') }))}
                            placeholder="0000 0000 0000 0000"
                            className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre en la tarjeta</label>
                          <Input
                            value={cardData.name}
                            onChange={(e) => setCardData(p => ({ ...p, name: e.target.value }))}
                            placeholder="Como aparece en el plástico"
                            className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium uppercase"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Expiración</label>
                          <Input
                            value={cardData.expiry}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, '');
                              if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                              setCardData(p => ({ ...p, expiry: v }));
                            }}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">CVV</label>
                          <Input
                            value={cardData.cvc}
                            onChange={(e) => setCardData(p => ({ ...p, cvc: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                            placeholder="123"
                            maxLength={3}
                            type="password"
                            className="h-12 rounded-xl bg-muted/30 dark:bg-muted/10 border-none font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPago === 'TRANSFERENCIA' && (
                    <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/10 border-2 border-primary/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary">
                          <Info className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg mb-1">Pasos para transferencia</h4>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Al confirmar tu pedido, te enviaremos los datos de nuestras cuentas bancarias por correo. 
                            Tendrás 24 horas para realizar el depósito y enviar el comprobante.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {metodoPago === 'CONTRA_ENTREGA' && (
                    <div className="p-6 rounded-3xl bg-primary/5 dark:bg-primary/10 border-2 border-primary/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary">
                          <Banknote className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg mb-1">Pago al recibir</h4>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Podrás pagar en efectivo o con tarjeta al momento de recibir tu pedido. 
                            Por favor ten el monto exacto si decides pagar en efectivo.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="bg-card dark:bg-card/50 rounded-[2rem] border dark:border-primary/10 p-8 shadow-sm space-y-8">
                  <h2 className="text-2xl font-black flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    Último vistazo
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-muted/30 dark:bg-muted/10 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Envío
                      </h4>
                      <div className="space-y-1">
                        <p className="font-black">{direccionEnvio.nombreReceptor}</p>
                        <p className="text-sm text-muted-foreground font-medium">{direccionEnvio.direccion}</p>
                        <p className="text-sm text-muted-foreground font-medium">{direccionEnvio.ciudad}, {direccionEnvio.departamento}</p>
                        <p className="text-sm text-muted-foreground font-medium">Telf: {direccionEnvio.telefonoReceptor}</p>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-muted/30 dark:bg-muted/10 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-3 w-3" /> Pago
                      </h4>
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-widest">
                          {metodoPago === 'TARJETA' ? 'Tarjeta' : metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : metodoPago === 'CREDITO' ? 'Crédito ZAI' : 'Contra entrega'}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {metodoPago === 'TARJETA' ? `Termina en ${cardData.number.slice(-4)}` : metodoPago === 'CREDITO' ? 'Cargo a cuenta' : 'Pendiente de confirmación'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-12 flex gap-4">
              {step > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => setStep(s => (s - 1) as any)}
                  className="h-14 px-8 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-muted dark:hover:bg-muted/20"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Atrás
                </Button>
              )}
              
              <div className="ml-auto">
                {step < 5 ? (
                  <Button
                    onClick={() => setStep(s => (s + 1) as any)}
                    disabled={nextDisabled}
                    className="h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 dark:shadow-primary/5 hover:shadow-primary/30 active:scale-95 transition-all"
                  >
                    Siguiente
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handlePay}
                    disabled={loading || items.length === 0}
                    className="h-14 px-12 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 dark:shadow-primary/5 hover:shadow-primary/30 active:scale-95 transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Procesando...
                      </div>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-5 w-5" />
                        Pagar S/ {totalFinal.toFixed(2)}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card dark:bg-card/50 rounded-[2rem] border dark:border-primary/10 p-8 shadow-sm sticky top-24">
              <h3 className="text-xl font-black mb-6">Tu Orden</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">IGV (18%)</span>
                  <span className="font-bold">S/ {igv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-bold">{costoEnvio === 0 ? 'Gratis' : `S/ ${costoEnvio.toFixed(2)}`}</span>
                </div>
                <div className="h-px bg-border dark:bg-primary/10 my-2" />
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black uppercase tracking-tighter">Total</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">S/ {totalFinal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/50 dark:bg-muted/10 border dark:border-primary/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Compra Protegida
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                  Tus datos están seguros con nosotros. Usamos encriptación de nivel bancario para proteger tu información.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Overlay de Procesamiento */}
      {paymentProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 dark:bg-background/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-center space-y-6 max-w-sm px-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-primary/20 dark:border-primary/10 mx-auto" />
              <div className="h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-1/2 -ml-12" />
              <CreditCard className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -mt-5 -ml-5 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight">{processingStatus || 'Procesando Pago'}</h3>
              <p className="text-sm text-muted-foreground font-medium">
                {metodoPago === 'TARJETA' 
                  ? 'Estamos validando tu transacción con tu entidad bancaria. Por favor no cierres esta ventana.'
                  : 'Estamos procesando tu orden de forma segura. Un momento por favor.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
