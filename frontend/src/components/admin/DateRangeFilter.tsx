import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  fechaInicio: string;
  fechaFin: string;
  onChange: (inicio: string, fin: string) => void;
  compact?: boolean;
}

export function DateRangeFilter({ fechaInicio, fechaFin, onChange, compact = false }: DateRangeFilterProps) {
  const setPredefinedRange = (range: string) => {
    const today = new Date();
    let start = new Date();
    
    switch(range) {
      case 'hoy':
        start = today;
        break;
      case 'semana':
        start.setDate(today.getDate() - 7);
        break;
      case 'mes':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'año':
        start.setFullYear(today.getFullYear() - 1);
        break;
    }
    
    onChange(start.toISOString().split('T')[0], today.toISOString().split('T')[0]);
  };

  return (
    <div className={`flex flex-col gap-4 ${compact ? '' : 'w-full'}`}>
      <div className="flex items-center justify-between">
        {!compact && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Filtrar por Periodo</span>
          </div>
        )}
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setPredefinedRange('hoy')}>Hoy</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setPredefinedRange('semana')}>7D</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setPredefinedRange('mes')}>30D</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setPredefinedRange('año')}>1A</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Desde</label>
          <Input 
            type="date" 
            value={fechaInicio} 
            onChange={(e) => onChange(e.target.value, fechaFin)} 
            className="h-9 bg-background text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Hasta</label>
          <Input 
            type="date" 
            value={fechaFin} 
            onChange={(e) => onChange(fechaInicio, e.target.value)} 
            className="h-9 bg-background text-sm"
          />
        </div>
      </div>
    </div>
  );
}
