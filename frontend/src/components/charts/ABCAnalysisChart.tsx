import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine,
  LabelList
} from 'recharts';

interface ABCAnalysisChartProps {
  data: any[];
}

export function ABCAnalysisChart({ data }: ABCAnalysisChartProps) {
  // Procesar datos para clasificación ABC
  // A: Top 80% ingresos, B: Siguiente 15%, C: Resto 5%
  const sortedData = [...data].sort((a, b) => b.ingresos_generados - a.ingresos_generados);
  const totalIngresos = sortedData.reduce((acc, curr) => acc + Number(curr.ingresos_generados), 0);
  
  let accumulated = 0;
  const abcData = sortedData.map((item) => {
    accumulated += Number(item.ingresos_generados);
    const percentage = (accumulated / totalIngresos) * 100;
    
    let classification = 'C';
    if (percentage <= 80) classification = 'A';
    else if (percentage <= 95) classification = 'B';

    return {
      name: item.nombre,
      ingresos: Number(item.ingresos_generados),
      percentage: percentage.toFixed(1),
      classification
    };
  });

  const COLORS = {
    A: '#10b981', // emerald-500
    B: '#f59e0b', // amber-500
    C: '#ef4444', // rose-500
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={abcData.slice(0, 15)} // Mostrar top 15 para legibilidad
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            interval={0} 
            height={80}
            tick={{ fontSize: 10, fontWeight: 600 }}
          />
          <YAxis 
            tick={{ fontSize: 10, fontWeight: 600 }}
            tickFormatter={(value) => `S/ ${value}`}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: number, _name: string, props: any) => [
              `S/ ${value.toFixed(2)} (${props.payload.classification})`, 
              'Ingresos'
            ]}
          />
          <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
            {abcData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.classification as keyof typeof COLORS]} />
            ))}
            <LabelList 
              dataKey="classification" 
              position="top" 
              style={{ fontSize: '10px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }} 
            />
          </Bar>
          <ReferenceLine y={totalIngresos * 0.8} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: '80%', fill: '#10b981', fontSize: 10 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
