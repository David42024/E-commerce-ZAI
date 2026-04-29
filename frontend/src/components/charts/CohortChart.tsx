import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';

interface CohortChartProps {
  data: any[];
}

export function CohortChart({ data }: CohortChartProps) {
  // El backend devuelve una lista plana. Necesitamos agruparla por mes_numero para ver la tendencia de retención.
  // O podemos mostrar un gráfico de áreas para los meses de retención.
  
  // Agrupar por mes_numero para ver el promedio de retención de todos los cohortes
  const retentionByMonth = data.reduce((acc: any, curr: any) => {
    const month = curr.month_number;
    if (!acc[month]) {
      acc[month] = { month: `Mes ${month}`, total: 0, count: 0 };
    }
    acc[month].total += Number(curr.retention_rate);
    acc[month].count += 1;
    return acc;
  }, {});

  const chartData = Object.values(retentionByMonth).map((item: any) => ({
    month: item.month,
    rate: Number((item.total / item.count).toFixed(1))
  })).sort((a, b) => {
    const m1 = parseInt(a.month.split(' ')[1]);
    const m2 = parseInt(b.month.split(' ')[1]);
    return m1 - m2;
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 10, fontWeight: 600 }}
          />
          <YAxis 
            tick={{ fontSize: 10, fontWeight: 600 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="rate" 
            name="Tasa de Retención Promedio"
            stroke="#6366f1" 
            fillOpacity={1} 
            fill="url(#colorRate)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
