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
  Eye, 
  Loader2,
  MapPin,
  X,
  Crown,
  Star,
  UserPlus,
  Zap,
  Download,
  Users,
  UserCheck,
  UserX,
  FileText,
  ArrowUpDown,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ClientesAdmin() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const limit = 10;

  type ClienteRow = {
    id: string;
    nombre: string;
    apellido: string;
    documentoIdentidad?: string | null;
    telefono?: string | null;
    created_at?: string | null;
    usuario?: { correo?: string | null; activo?: boolean | null; created_at?: string | null } | null;
    direcciones?: Array<{ id: string; alias?: string | null; direccion: string; ciudad: string; departamento: string; esPrincipal?: boolean | null }>;
    ordenes?: Array<{ id: string; numeroOrden: string; created_at: string; totalFinal: number; estado?: { nombre?: string | null } | null }>;
    _count?: { ordenes?: number };
    limite_credito?: number | string;
    saldo_deudor?: number | string;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['clientes-admin', page, search, segmentFilter, statusFilter],
    queryFn: () => clienteService.listarAdmin({ page, limit, search }),
  });

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      // Fetch all data for export
      const allData = await clienteService.listarAdmin({ 
        page: 1, 
        limit: 1000, 
        search
      });

      const items = (allData.data.data || []) as ClienteRow[];
      if (!items || items.length === 0) {
        toast.error('No hay datos para exportar');
        return;
      }

      const headers = ['ID', 'Nombre', 'Apellido', 'Email', 'Teléfono', 'Documento', 'Órdenes', 'Estado', 'Segmento', 'Fecha Registro'];
      const csvRows = items.map((c: ClienteRow) => {
        const segment = getSegment(c).label;
        return [
          c.id,
          `"${c.nombre}"`,
          `"${c.apellido}"`,
          c.usuario?.correo,
          c.telefono || 'N/A',
          c.documentoIdentidad || 'N/A',
          c._count?.ordenes || 0,
          c.usuario?.activo ? 'Activo' : 'Inactivo',
          segment,
          new Date(c.created_at || Date.now()).toISOString().split('T')[0]
        ].join(',');
      });

      const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Exportación completada');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  const getSegment = (c: any) => {
    const orderCount = c._count?.ordenes || 0;
    const createdAt = new Date(c.created_at || Date.now());
    const isNew = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30) < 3;

    if (orderCount > 10) return { label: 'VIP', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', icon: <Crown className="w-3 h-3" /> };
    if (orderCount >= 4) return { label: 'Frecuente', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', icon: <Star className="w-3 h-3" /> };
    if (isNew && orderCount === 0) return { label: 'Nuevo', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', icon: <UserPlus className="w-3 h-3" /> };
    if (orderCount > 0) return { label: 'Casual', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', icon: <Zap className="w-3 h-3" /> };
    return { label: 'Potencial', color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: <User className="w-3 h-3" /> };
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

  const clientes = (clientesRaw as ClienteRow[]).filter((c: ClienteRow) => {
    if (segmentFilter === 'todos') return true;
    return getSegment(c).label === segmentFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Gestión de Clientes
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Control total de la base de datos de usuarios y clientes.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="h-12 border-2 rounded-2xl font-bold gap-2 hover:bg-primary hover:text-white transition-all duration-300"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-2 rounded-3xl overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Clientes</p>
                <h3 className="text-2xl font-black">{total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Podríamos agregar más stats aquí si el API las provee */}
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, correo o DNI..." 
                className="pl-12 h-14 bg-background border-2 rounded-2xl font-medium focus:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex min-w-[180px] flex-1 flex-col gap-1 lg:flex-none">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Segmento</label>
                <select
                  className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold"
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                >
                  <option value="todos">Todos los Segmentos</option>
                  <option value="VIP">VIP</option>
                  <option value="Frecuente">Frecuente</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Casual">Casual</option>
                  <option value="Potencial">Potencial</option>
                </select>
              </div>

              <div className="flex min-w-[180px] flex-1 flex-col gap-1 lg:flex-none">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</label>
                <select
                  className="h-12 rounded-2xl border-2 bg-background px-4 text-sm font-bold"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="rounded-[2rem] border-2 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b-2 transition-colors">
                    <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px]">Cliente</th>
                    <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px]">Segmento</th>
                    <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px]">Contacto</th>
                    <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px] text-center">Órdenes</th>
                    <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px]">Estado</th>
                    <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px]">Registro</th>
                    <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="font-bold text-muted-foreground">Cargando base de datos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : clientes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="h-12 w-12 text-muted-foreground/30" />
                          <p className="font-bold text-muted-foreground text-lg">No se encontraron clientes</p>
                          <Button variant="link" onClick={() => {setSearch(''); setSegmentFilter('todos'); setStatusFilter('todos');}}>Limpiar filtros</Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clientes.map((c: any) => (
                      <tr key={c.id} className="group hover:bg-muted/30 transition-all duration-200">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg group-hover:scale-110 transition-transform">
                              {c.nombre[0]}{c.apellido[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-base leading-tight">{c.nombre} {c.apellido}</span>
                              <span className="text-xs font-bold text-muted-foreground/60 mt-1 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                DNI: {c.documentoIdentidad || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {(() => {
                            const segment = getSegment(c);
                            return (
                              <Badge variant="outline" className={cn("h-8 px-3 gap-1.5 font-bold border-2 rounded-xl", segment.color)}>
                                {segment.icon}
                                {segment.label}
                              </Badge>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                              <Mail className="h-3.5 w-3.5" />
                              {c.usuario?.correo}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60">
                              <Phone className="h-3.5 w-3.5" />
                              {c.telefono || 'Sin teléfono'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-muted font-black text-foreground border-2">
                            {c._count?.ordenes || 0}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {c.usuario?.activo ? (
                            <Badge variant="secondary" className="h-8 px-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 gap-1.5 font-bold rounded-xl border-2">
                              <UserCheck className="h-3.5 w-3.5" /> Activo
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="h-8 px-3 bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 gap-1.5 font-bold rounded-xl border-2">
                              <UserX className="h-3.5 w-3.5" /> Inactivo
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-muted-foreground">Registrado el</span>
                            <span className="text-sm font-black text-foreground">
                              {c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                            onClick={() => handleViewDetails(c.id)}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t-2 bg-muted/20">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Página {page} de {totalPages || 1} • {total} clientes totales
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-4 border-2 rounded-xl font-bold gap-2" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ArrowUpDown className="h-4 w-4 rotate-90" />
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-4 border-2 rounded-xl font-bold gap-2"
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                  <ArrowUpDown className="h-4 w-4 -rotate-90" />
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