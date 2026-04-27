import { useQuery } from '@tanstack/react-query';
import { ordenService } from '@/services/orden.service';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function MisOrdenes() {
  const usuarioId = useAuthStore((s) => s.usuario?.id);
  const { data: res } = useQuery({
    queryKey: ['mis-ordenes', usuarioId],
    queryFn: () => ordenService.getMisOrdenes({ page: 1, limit: 20 }),
    enabled: !!usuarioId,
  });

  const ordenes = res?.data.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mis Órdenes</h1>
        <p className="text-muted-foreground">Historial detallado de tus compras y estados de envío.</p>
      </div>

      <div className="grid gap-4">
        {ordenes.map((o) => (
          <div 
            key={o.id} 
            className="group border rounded-2xl p-6 bg-card shadow-sm ring-1 ring-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:ring-primary/20 hover:shadow-md"
          >
            <div className="space-y-1">
              <p className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                {o.numeroOrden}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <span>{new Date(o.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                <span>•</span>
                <span>{o.items?.length || 0} {o.items?.length === 1 ? 'producto' : 'productos'}</span>
              </div>
            </div>
            
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
              <p className="font-bold text-xl tracking-tight">S/ {Number(o.totalFinal).toFixed(2)}</p>
              <Badge 
                variant={o.estado.nombre === 'CANCELADA' ? 'destructive' : 'outline'}
                className={cn(
                  "text-[10px] font-bold px-3",
                  o.estado.nombre === 'PAGADA' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  o.estado.nombre === 'PENDIENTE' && "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {o.estado.nombre}
              </Badge>
            </div>
          </div>
        ))}
        
        {ordenes.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/20">
            <p className="text-muted-foreground font-medium">Aún no has realizado ninguna compra.</p>
          </div>
        )}
      </div>
    </div>
  );
}