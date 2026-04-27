import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { 
  Search, 
  History, 
  User, 
  Database, 
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ActividadAdmin() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fechaInicio, setFechaInicio] = useState('2024-01-01');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['actividad-logs', page, search, fechaInicio, fechaFin],
    queryFn: () => adminService.getLogsActividad({ page, limit, search, fechaInicio, fechaFin }),
  });

  const logs = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getBadgeColor = (accion: string) => {
    if (accion.includes('CREATE')) return 'bg-green-100 text-green-800 border-green-200';
    if (accion.includes('UPDATE')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (accion.includes('DELETE')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Logs de Actividad</h1>
          <p className="text-muted-foreground">Historial detallado de todas las acciones realizadas en el sistema.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
        <CardContent className="pt-6">
          <DateRangeFilter 
            fechaInicio={fechaInicio} 
            fechaFin={fechaFin} 
            onChange={(inicio, fin) => {
              setFechaInicio(inicio);
              setFechaFin(fin);
              setPage(1);
            }} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Registros de Auditoría
            </CardTitle>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por acción, tabla o usuario..." 
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Cargando registros...</div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No se encontraron registros.</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Usuario</th>
                      <th className="px-4 py-3 font-medium">Acción</th>
                      <th className="px-4 py-3 font-medium">Tabla</th>
                      <th className="px-4 py-3 font-medium">ID Entidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {format(new Date(log.fechaAccion), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {log.usuarioEjecutor?.correo || 'Sistema'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={getBadgeColor(log.accion)}>
                            {log.accion}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Database className="w-3.5 h-3.5 text-muted-foreground" />
                            {log.tablaAfectada}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {log.registroId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} registros
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
