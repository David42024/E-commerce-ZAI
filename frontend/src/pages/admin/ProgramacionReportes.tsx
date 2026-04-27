import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Play,
  Loader2,
  Settings2,
  FileCode
} from 'lucide-react';

export default function ProgramacionReportes() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipoReporte: 'operacional/ordenes',
    frecuencia: 'DIARIA',
    formato: 'pdf',
    destinatarios: '',
    campos: [] as string[]
  });

  const { data: programaciones, isLoading } = useQuery({
    queryKey: ['reportes-programacion'],
    queryFn: () => adminService.listarProgramaciones()
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.crearProgramacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes-programacion'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Programación creada correctamente');
    },
    onError: () => toast.error('Error al crear programación')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.eliminarProgramacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes-programacion'] });
      toast.success('Programación eliminada');
    },
    onError: () => toast.error('Error al eliminar')
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string, activo: boolean }) => 
      adminService.actualizarProgramacion(id, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes-programacion'] });
      toast.success('Estado actualizado');
    }
  });

  const runManualMutation = useMutation({
    mutationFn: () => adminService.ejecutarManualProgramaciones(),
    onSuccess: () => toast.success('Procesamiento manual iniciado')
  });

  const updateField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipoReporte: 'operacional/ordenes',
      frecuencia: 'DIARIA',
      formato: 'pdf',
      destinatarios: '',
      campos: []
    });
  };

  const availableReports = [
    { id: 'operacional/ordenes', label: 'Reporte de Órdenes' },
    { id: 'operacional/inventario', label: 'Reporte de Inventario' },
    { id: 'operacional/clientes', label: 'Reporte de Clientes' },
    { id: 'gestion/financiero', label: 'Estados Financieros' },
    { id: 'gestion/mas-vendidos', label: 'Productos Más Vendidos' },
  ];

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>;

  const progs = programaciones?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Programación de Reportes</h2>
          <p className="text-muted-foreground">Configura el envío automático de informes por correo electrónico.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => runManualMutation.mutate()} disabled={runManualMutation.isPending}>
            <Play className="w-4 h-4 mr-2" /> Ejecutar Ahora
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Programación
          </Button>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[500px] rounded-lg border bg-background shadow-xl">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold">Programar Nuevo Reporte</h3>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la tarea</label>
                <Input 
                  placeholder="Ej: Ventas Diarias Gerencia" 
                  value={formData.nombre}
                  onChange={e => updateField('nombre', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reporte</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.tipoReporte}
                    onChange={e => updateField('tipoReporte', e.target.value)}
                  >
                    {availableReports.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frecuencia</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.frecuencia}
                    onChange={e => updateField('frecuencia', e.target.value)}
                  >
                    <option value="DIARIA">Diaria</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSUAL">Mensual</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Formato</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.formato}
                    onChange={e => updateField('formato', e.target.value)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destinatarios (separados por coma)</label>
                  <Input 
                    placeholder="admin@zai.com, gerencia@zai.com" 
                    value={formData.destinatarios}
                    onChange={e => updateField('destinatarios', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                Programar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {progs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No hay reportes programados actualmente.</p>
            </CardContent>
          </Card>
        ) : (
          progs.map((p: any) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${p.activo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{p.nombre}</h3>
                        <Badge variant={p.activo ? 'default' : 'secondary'} className="text-[10px]">
                          {p.activo ? 'ACTIVO' : 'PAUSADO'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1"><Settings2 className="w-3 h-3" /> {p.tipoReporte}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.frecuencia}</span>
                        <span className="flex items-center gap-1 uppercase"><FileCode className="w-3 h-3" /> {p.formato}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Próximo Envío</p>
                      <p className="text-sm font-medium">{p.proximoEnvio ? new Date(p.proximoEnvio).toLocaleString() : 'Pendiente'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleMutation.mutate({ id: p.id, activo: !p.activo })}
                      >
                        {p.activo ? <XCircle className="h-5 w-5 text-rose-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => {
                          if (confirm('¿Eliminar esta programación?')) deleteMutation.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 px-6 py-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Enviar a: <span className="font-medium text-foreground">{p.destinatarios}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Último envío: {p.ultimoEnvio ? new Date(p.ultimoEnvio).toLocaleString() : 'Nunca'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
