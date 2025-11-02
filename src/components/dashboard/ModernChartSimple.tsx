// Versión simplificada de ModernChart sin animaciones complejas
interface ChartDataPoint {
  month: string;
  actual: number;
  expected: number;
  isCurrentMonth: boolean;
  isFutureMonth: boolean;
}

interface ModernChartSimpleProps {
  data: ChartDataPoint[];
}

export function ModernChartSimple({ data }: ModernChartSimpleProps) {
  console.log('🎨 ModernChartSimple: Renderizando con datos:', data);

  if (!data || data.length === 0) {
    console.log('❌ ModernChartSimple: No hay datos');
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No hay datos disponibles para el gráfico</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(d => Math.max(d.actual, d.expected)), 1);
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 40, bottom: 60, left: 60 };

  // Calcular puntos para las líneas
  const actualPoints = data.map((item, index) => ({
    x: padding.left + (index * (chartWidth - padding.left - padding.right)) / (data.length - 1),
    y: padding.top + (chartHeight - padding.top - padding.bottom) - ((item.actual / maxAmount) * (chartHeight - padding.top - padding.bottom)),
    value: item.actual,
    month: item.month,
    isCurrentMonth: item.isCurrentMonth
  }));

  const expectedPoints = data.map((item, index) => ({
    x: padding.left + (index * (chartWidth - padding.left - padding.right)) / (data.length - 1),
    y: padding.top + (chartHeight - padding.top - padding.bottom) - ((item.expected / maxAmount) * (chartHeight - padding.top - padding.bottom)),
    value: item.expected
  }));

  // Crear path simple
  const createPath = (points: any[]) => {
    if (!points || points.length < 2) return '';
    
    let path = `M ${points[0]?.x || 0} ${points[0]?.y || 0}`;
    
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      if (curr) {
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  const actualPath = createPath(actualPoints);
  const expectedPath = createPath(expectedPoints);

  // Líneas de grid
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    y: padding.top + (chartHeight - padding.top - padding.bottom) * ratio,
    value: Math.round(maxAmount * (1 - ratio))
  }));

  console.log('✅ ModernChartSimple: Renderizando SVG');

  return (
    <div className="relative w-full h-full bg-white">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Ingresos de este año</h3>
        <p className="text-sm text-gray-600 mb-4">Gráfico simplificado - Max: €{maxAmount.toLocaleString()}</p>
      </div>
      
      <svg 
        width={chartWidth} 
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        {/* Grid horizontal */}
        {gridLines.map((line, index) => (
          <g key={index}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={chartWidth - padding.right}
              y2={line.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            {/* Etiquetas del eje Y */}
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              €{line.value.toLocaleString()}
            </text>
          </g>
        ))}

        {/* Línea de ingresos esperados */}
        <path
          d={expectedPath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Línea de ingresos reales */}
        <path
          d={actualPath}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Puntos de datos */}
        {actualPoints.map((point, index) => (
          <g key={`actual-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#ffffff"
              stroke="#10b981"
              strokeWidth="2"
            />
            
            {/* Indicador de mes actual */}
            {point.isCurrentMonth && (
              <circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                opacity="0.5"
              />
            )}
          </g>
        ))}

        {/* Puntos esperados */}
        {expectedPoints.map((point, index) => (
          <circle
            key={`expected-${index}`}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#6366f1"
          />
        ))}

        {/* Etiquetas de meses */}
        {actualPoints.map((point, index) => (
          <text
            key={`month-${index}`}
            x={point.x}
            y={chartHeight - padding.bottom + 20}
            textAnchor="middle"
            className={`text-xs ${
              point.isCurrentMonth
                ? 'fill-emerald-600 font-bold'
                : 'fill-gray-500'
            }`}
          >
            {point.month}
          </text>
        ))}

        {/* Título del eje Y */}
        <text
          x={20}
          y={chartHeight / 2}
          textAnchor="middle"
          className="text-sm fill-gray-600"
          transform={`rotate(-90, 20, ${chartHeight / 2})`}
        >
          Ingresos (€)
        </text>
      </svg>

      {/* Leyenda */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-emerald-500 rounded"></div>
          <span className="text-gray-700">Ingresos Reales</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-indigo-500 rounded border-dashed border border-indigo-500"></div>
          <span className="text-gray-700">Ingresos Esperados</span>
        </div>
      </div>
    </div>
  );
}