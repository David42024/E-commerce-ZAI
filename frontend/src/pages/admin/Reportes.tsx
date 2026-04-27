import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet, FileCode, Download, Calendar, Clock } from 'lucide-react';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import ProgramacionReportes from './ProgramacionReportes';
import { cn } from '@/lib/utils';

export default function Reportes() {
  const [activeTab, setActiveTab] = useState<'generar' | 'programar'>('generar');
  const [fechaInicio, setFechaInicio] = useState('2024-01-01');
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>({
    'operacional/ordenes': ['id', 'fecha', 'cliente', 'total', 'estado'],
    'operacional/inventario': ['producto', 'categoria', 'sku', 'stock', 'minimo', 'estado'],
    'operacional/clientes': ['nombre', 'apellido', 'correo', 'dni', 'ordenes', 'registro'],
    'gestion/mas-vendidos': ['sku', 'nombre', 'total_vendido', 'ingresos_generados'],
    'gestion/financiero': ['ingresos_brutos', 'costo_mercancia_vendida', 'utilidad_bruta'],
  });

  const availableFields: Record<string, { label: string, value: string }[]> = {
    'operacional/ordenes': [
      { label: 'ID Orden', value: 'id' },
      { label: 'Fecha', value: 'fecha' },
      { label: 'Cliente', value: 'cliente' },
      { label: 'Total', value: 'total' },
      { label: 'Estado', value: 'estado' },
    ],
    'operacional/inventario': [
      { label: 'Producto', value: 'producto' },
      { label: 'Categoría', value: 'categoria' },
      { label: 'SKU', value: 'sku' },
      { label: 'Stock', value: 'stock' },
      { label: 'Mínimo', value: 'minimo' },
      { label: 'Estado', value: 'estado' },
    ],
    'operacional/clientes': [
      { label: 'Nombre', value: 'nombre' },
      { label: 'Apellido', value: 'apellido' },
      { label: 'Correo', value: 'correo' },
      { label: 'DNI', value: 'dni' },
      { label: 'Órdenes', value: 'ordenes' },
      { label: 'Registro', value: 'registro' },
    ],
    'gestion/mas-vendidos': [
      { label: 'SKU', value: 'sku' },
      { label: 'Producto', value: 'nombre' },
      { label: 'Unidades', value: 'total_vendido' },
      { label: 'Ingresos', value: 'ingresos_generados' },
    ],
    'gestion/financiero': [
      { label: 'Ingresos Brutos', value: 'ingresos_brutos' },
      { label: 'Costo de Ventas', value: 'costo_mercancia_vendida' },
      { label: 'Utilidad Bruta', value: 'utilidad_bruta' },
    ],
  };

  const toggleField = (reportId: string, fieldValue: string) => {
    setSelectedFields(prev => {
      const current = prev[reportId] || [];
      const updated = current.includes(fieldValue)
        ? current.filter(f => f !== fieldValue)
        : [...current, fieldValue];
      return { ...prev, [reportId]: updated };
    });
  };

  const handleDateChange = (inicio: string, fin: string) => {
    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  const downloadReport = async (tipo: string, format: 'pdf' | 'excel' | 'csv') => {
    setLoading(`${tipo}-${format}`);
    try {
      const campos = selectedFields[tipo];
      const response = await adminService.getReportePDF(tipo, { 
        fechaInicio, 
        fechaFin,
        format,
        campos: campos ? campos.join(',') : undefined
      });
      
      let extension = 'pdf';
      let contentType = 'application/pdf';

      if (format === 'excel') {
        extension = 'xlsx';
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (format === 'csv') {
        extension = 'csv';
        contentType = 'text/csv';
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data as any], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${tipo.replace(/\//g, '_')}_${Date.now()}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Reporte generado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar reporte');
    } finally {
      setLoading(null);
    }
  };

  const reportesConfig = [
    {
      id: 'operacional/ordenes',
      titulo: 'Reporte de Órdenes',
      descripcion: 'Detalle completo de ventas y estados de órdenes en el periodo seleccionado.',
      icon: <FileText className="w-8 h-8 text-blue-500" />
    },
    {
      id: 'operacional/inventario',
      titulo: 'Reporte de Inventario',
      descripcion: 'Estado actual del stock, productos bajo mínimo y valoración de existencias.',
      icon: <FileSpreadsheet className="w-8 h-8 text-green-500" />
    },
    {
      id: 'operacional/clientes',
      titulo: 'Reporte de Clientes',
      descripcion: 'Listado de clientes registrados, frecuencia de compra y datos de contacto.',
      icon: <Calendar className="w-8 h-8 text-purple-500" />
    },
    {
      id: 'gestion/financiero',
      titulo: 'Estados Financieros',
      descripcion: 'Resumen de ingresos, costos de ventas y utilidad bruta por periodo.',
      icon: <FileText className="w-8 h-8 text-emerald-500" />
    },
    {
      id: 'gestion/mas-vendidos',
      titulo: 'Productos Más Vendidos',
      descripcion: 'Ranking de productos con mayor volumen de ventas e ingresos.',
      icon: <Download className="w-8 h-8 text-amber-500" />
    },
    {
      id: 'gestion/ventas',
      titulo: 'Análisis de Gestión',
      descripcion: 'Reporte estratégico con gráficos y tendencias de ventas (Solo PDF).',
      icon: <Download className="w-8 h-8 text-orange-500" />,
      onlyPdf: true,
      noFields: true
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Reportes</h1>
          <p className="text-muted-foreground mt-1">Genera y exporta informes detallados con datos reales de la plataforma.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit border border-border/50">
        <Button 
          variant={activeTab === 'generar' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('generar')}
          className={cn("gap-2", activeTab === 'generar' && "bg-background shadow-sm")}
        >
          <Download className="w-4 h-4" /> Generar Ahora
        </Button>
        <Button 
          variant={activeTab === 'programar' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('programar')}
          className={cn("gap-2", activeTab === 'programar' && "bg-background shadow-sm")}
        >
          <Clock className="w-4 h-4" /> Programación
        </Button>
      </div>

      {activeTab === 'generar' ? (
        <>
          <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
            <CardContent className="pt-6">
              <DateRangeFilter 
                fechaInicio={fechaInicio} 
                fechaFin={fechaFin} 
                onChange={handleDateChange} 
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportesConfig.map((rep) => (
              <Card key={rep.id} className="group hover:shadow-lg transition-all duration-300 border-none ring-1 ring-border/50 bg-card/50 overflow-hidden flex flex-col">
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-muted/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      {rep.icon}
                    </div>
                    <div className="flex gap-2">
                      {!rep.onlyPdf && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600"
                            onClick={() => downloadReport(rep.id, 'excel')}
                            disabled={!!loading}
                            title="Exportar a Excel"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 hover:bg-amber-50 hover:text-amber-600"
                            onClick={() => downloadReport(rep.id, 'csv')}
                            disabled={!!loading}
                            title="Exportar a CSV"
                          >
                            <FileCode className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => downloadReport(rep.id, 'pdf')}
                        disabled={!!loading}
                        title="Exportar a PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{rep.titulo}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{rep.descripcion}</CardDescription>
                  </div>

                  {!rep.noFields && availableFields[rep.id] && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Campos a incluir:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {availableFields[rep.id].map((field) => (
                          <div key={field.value} className="flex items-center space-x-2">
                            <input
                              id={`${rep.id}-${field.value}`}
                              type="checkbox"
                              checked={(selectedFields[rep.id] || []).includes(field.value)}
                              onChange={() => toggleField(rep.id, field.value)}
                              className="h-3.5 w-3.5 rounded border-border"
                            />
                            <label 
                              htmlFor={`${rep.id}-${field.value}`}
                              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {field.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-muted/30 flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Formatos: {rep.onlyPdf ? 'PDF' : 'PDF, EXCEL, CSV'}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <ProgramacionReportes />
      )}
    </div>
  );
}
