import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface RFMChartProps {
  data: any[];
}

export function RFMChart({ data }: RFMChartProps) {
  // RFM Bubble Chart: 
  // X: Recency Score (1-5)
  // Y: Frequency Score (1-5)
  // Z: Monetary Value (Size)
  
  const chartData = data.map((item) => ({
    x: Number(item.r_score),
    y: Number(item.f_score),
    z: Number(item.monetary),
    name: item.cliente,
    recency: item.recency,
    frequency: item.frequency,
    monetary: item.monetary
  }));

  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Recencia (Score)" 
            domain={[0, 6]} 
            tickCount={6}
            tick={{ fontSize: 10, fontWeight: 600 }}
            label={{ value: 'Recencia (Puntaje)', position: 'insideBottom', offset: -10, fontSize: 12, fontWeight: 'bold' }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Frecuencia (Score)" 
            domain={[0, 6]} 
            tickCount={6}
            tick={{ fontSize: 10, fontWeight: 600 }}
            label={{ value: 'Frecuencia (Puntaje)', angle: -90, position: 'insideLeft', fontSize: 12, fontWeight: 'bold' }}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Monetario" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card p-3 border border-border rounded-xl shadow-xl space-y-1">
                    <p className="font-black text-primary">{data.name}</p>
                    <div className="text-[10px] space-y-0.5">
                      <p><span className="text-muted-foreground uppercase">Recencia:</span> {data.recency} días</p>
                      <p><span className="text-muted-foreground uppercase">Frecuencia:</span> {data.frequency} pedidos</p>
                      <p><span className="text-muted-foreground uppercase">Monetario:</span> S/ {Number(data.monetary).toFixed(2)}</p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Clientes" data={chartData}>
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
