# Sistema de Diseño ZAI - Documentación de Refactorización

## 1. Principios de Diseño
- **Minimalismo de Alto Nivel**: Estética inspirada en Vercel y Linear. Uso predominante de bordes sutiles sobre sombras pesadas.
- **Rendimiento Visual**: Optimización de Core Web Vitals mediante el uso de clases de utilidad puras de Tailwind CSS y eliminación de estilos redundantes.
- **Alineación Perfecta**: Sistema de grillas rígido basado en múltiplos de 4px (p-4, gap-8, mb-12).

## 2. Tokens de Diseño Implementados

### Espaciado
- `p-8` / `gap-8`: Espaciado estándar para contenedores principales y secciones.
- `p-4` / `gap-4`: Espaciado para tarjetas y elementos internos.
- `px-6 py-4`: Padding estándar para filas de tablas y celdas.

### Tipografía Semántica
- **Títulos**: `text-3xl font-bold tracking-tight` para H1.
- **Subtítulos**: `text-lg font-bold text-foreground` para títulos de tarjetas.
- **Labels**: `text-[10px] font-bold uppercase tracking-wider` para encabezados de tabla y badges.
- **Cuerpo**: `text-sm font-medium` para contenido principal; `text-xs font-medium text-muted-foreground` para información secundaria.

### Componentes Core
- **Cards**: `rounded-xl border shadow-sm ring-1 ring-border/50`. Enfoque en profundidad mediante anillos sutiles.
- **Buttons**: `transition-all active:scale-[0.98]`. Feedback táctil inmediato.
- **Inputs**: `rounded-lg border-input bg-background hover:border-primary/30`. Transiciones suaves en hover y focus.

## 3. Patrones de UX
- **Densidad de Información**: Tablas compactas con acciones que aparecen en hover (`group-hover:opacity-100`) para reducir ruido visual.
- **Feedback de Estado**: Uso de Badges con colores semánticos suaves (Emerald para éxito, Rose para error, Amber para advertencia).
- **Navegación Fluida**: Sidebar colapsable con estados activos claros (`bg-primary/5 text-primary font-medium`).

## 4. Métricas de Rendimiento (Objetivos)
- **LCP**: < 2.5s (Uso de fuentes del sistema y CSS atómico).
- **FID**: < 100ms (Componentes React 18 altamente optimizados).
- **CLS**: < 0.1 (Layouts estables con anchos definidos y skeleton-ready structures).
