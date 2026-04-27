import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clienteService } from '@/services/cliente.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  ShoppingBag, 
  Eye, 
  Loader2,
  MapPin,
  X,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Star,
  UserPlus,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClientesAdmin() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('todos');
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['clientes-admin', page, search],
    queryFn: () => clienteService.listarAdmin({ page, limit, search }),
  });

  const getSegment = (c: any) => {
    const orderCount = c._count?.ordenes || 0;
    const createdAt = new Date(c.created_at || Date.now());
    const isNew = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30) < 3;

    if (orderCount > 10) return { label: 'VIP', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Crown className="w-3 h-3" /> };
    if (orderCount >= 4) return { label: 'Frecuente', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Star className="w-3 h-3" /> };
    if (isNew && orderCount === 0) return { label: 'Nuevo', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <UserPlus className="w-3 h-3" /> };
    if (orderCount > 0) return { label: 'Casual', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Zap className="w-3 h-3" /> };
    return { label: 'Potencial', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <User className="w-3 h-3" /> };
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await clienteService.obtenerDetalleAdmin(id);
      setSelectedCliente(res.data);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error('Error al cargar los detalles del cliente');
    }
  };

  const clientesRaw = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const clientes = clientesRaw.filter((c: any) => {
    if (segmentFilter === 'todos') return true;
    return getSegment(c).label === segmentFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground mt-1">Visualiza y gestiona la base de datos de tus clientes.</p>
        </div>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, correo o DNI..." 
                className="pl-9 h-10 bg-background"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Segmento:</span>
              <select 
                className="h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="VIP">VIP</option>
                <option value="Frecuente">Frecuente</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Casual">Casual</option>
                <option value="Potencial">Potencial</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b transition-colors">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Segmento</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Contacto</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-center">Órdenes</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Último Acceso</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-muted-foreground">Cargando clientes...</p>
                      </td>
                    </tr>
                  ) : clientes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No se encontraron clientes.
                      </td>
                    </tr>
                  ) : (
                    clientes.map((c: any) => (
                      <tr key={c.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {c.nombre[0]}{c.apellido[0]}
                            </div>
                            <div className="flex flex-col leading-tight">
                              <span className="font-medium text-foreground">{c.nombre} {c.apellido}</span>
                              <span className="text-xs text-muted-foreground">ID: {c.documentoIdentidad || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {(() => {
                            const segment = getSegment(c);
                            return (
                              <Badge variant="outline" className={`gap-1 font-medium ${segment.color}`}>
                                {segment.icon}
                                {segment.label}
                              </Badge>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {c.usuario?.correo}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {c.telefono || 'Sin teléfono'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-medium">
                          {c._count.ordenes}
                        </td>
                        <td className="px-4 py-4">
                          {c.usuario?.activo ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                              <ShieldCheck className="h-3 w-3" /> Activo
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 gap-1">
                              <ShieldAlert className="h-3 w-3" /> Inactivo
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {c.usuario?.created_at ? new Date(c.usuario.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleViewDetails(c.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages || 1} ({total} clientes totales)
              </span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2"
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {isDetailsOpen && selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 sticky top-0 bg-card z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {selectedCliente.nombre[0]}{selectedCliente.apellido[0]}
                </div>
                <div>
                  <CardTitle className="text-2xl">{selectedCliente.nombre} {selectedCliente.apellido}</CardTitle>
                  <CardDescription>Perfil detallado e historial de actividad.</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Datos Personales
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID/DNI:</span>
                      <span className="font-medium">{selectedCliente.documentoIdentidad || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedCliente.usuario?.correo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="font-medium">{selectedCliente.telefono || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Miembro desde:</span>
                      <span className="font-medium">{new Date(selectedCliente.usuario?.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                    <Crown className="h-4 w-4" /> Estado de Cuenta
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Límite de Crédito:</span>
                      <span className="font-bold text-emerald-600">S/ {Number(selectedCliente.limiteCredito || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saldo Deudor:</span>
                      <span className="font-bold text-rose-600">S/ {Number(selectedCliente.saldoDeudor || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Crédito Disponible:</span>
                      <span className="font-bold text-blue-600">S/ {Number((selectedCliente.limiteCredito || 0) - (selectedCliente.saldoDeudor || 0)).toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-bold">Total Gastado:</span>
                        <span className="font-bold">S/ {selectedCliente.ordenes?.reduce((acc: number, o: any) => acc + Number(o.totalFinal), 0).toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Direcciones Guardadas
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedCliente.direcciones?.length === 0 ? (
                      <div className="py-4 text-center text-muted-foreground border border-dashed rounded-lg text-sm">
                        No hay direcciones registradas.
                      </div>
                    ) : (
                      selectedCliente.direcciones.map((dir: any) => (
                        <div key={dir.id} className="p-3 border rounded-lg bg-muted/10 relative group">
                          <p className="font-bold text-sm">{dir.alias || 'Dirección'}</p>
                          <p className="text-xs text-muted-foreground">{dir.direccion}</p>
                          <p className="text-xs text-muted-foreground">{dir.ciudad}, {dir.departamento}</p>
                          {dir.esPrincipal && (
                            <Badge className="absolute top-2 right-2 text-[8px] h-4 px-1">Principal</Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase text-muted-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" /> Últimas Órdenes ({selectedCliente._count.ordenes})
                  </h3>
                  <Button variant="link" size="sm" className="text-xs h-auto p-0">Ver todas</Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">N° Orden</th>
                        <th className="px-4 py-2 text-left">Fecha</th>
                        <th className="px-4 py-2 text-center">Estado</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedCliente.ordenes?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                            Este cliente aún no ha realizado compras.
                          </td>
                        </tr>
                      ) : (
                        selectedCliente.ordenes.map((o: any) => (
                          <tr key={o.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-bold text-primary">{o.numeroOrden}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(o.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {o.estado?.nombre}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              S/ {Number(o.totalFinal).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Cerrar Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}