// ModernChart component - Versión corregida
import { motion } from 'framer-motion';

interface ChartDataPoint {
  month: string;
  actual: number;
  expected: number;
  isCurrentMonth: boolean;
  isFutureMonth: boolean;
}

interface ModernChartProps {
  data: ChartDataPoint[];
}

export function ModernChartFixed({ data }: ModernChartProps) {
  console.log('🎨 ModernChartFixed: Renderizando con datos:', data);

  if (!data || data.length === 0) {
    console.log('❌ ModernChartFixed: No hay datos');
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <p className="text-gray-500 text-lg">📊 No hay datos disponibles</p>
          <p className="text-gray-400 text-sm mt-2">El gráfico aparecerá cuando haya datos</p>
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(d => Math.max(d.actual, d.expected)), 1);
  const chartWidth = 100;
  const chartHeight = 100;
  const padding = { top: 15, right: 15, bottom: 25, left: 15 };

  console.log('📊 ModernChartFixed: maxAmount =', maxAmount);

  // Calcular puntos para las líneas
  const actualPoints = data.map((item, index) => {
    const x = padding.left + (index * (chartWidth - padding.left - padding.right)) / Math.max(data.length - 1, 1);
    const y = padding.top + (chartHeight - padding.top - padding.bottom) - ((item.actual / maxAmount) * (chartHeight - padding.top - padding.bottom));
    
    return {
      x: isNaN(x) ? padding.left : x,
      y: isNaN(y) ? chartHeight - padding.bottom : y,
      value: item.actual,
      month: item.month,
      isCurrentMonth: item.isCurrentMonth,
      isFutureMonth: item.isFutureMonth
    };
  });

  const expectedPoints = data.map((item, index) => {
    const x = padding.left + (index * (chartWidth - padding.left - padding.right)) / Math.max(data.length - 1, 1);
    const y = padding.top + (chartHeight - padding.top - padding.bottom) - ((item.expected / maxAmount) * (chartHeight - padding.top - padding.bottom));
    
    return {
      x: isNaN(x) ? padding.left : x,
      y: isNaN(y) ? chartHeight - padding.bottom : y,
      value: item.expected
    };
  });

  // Crear path suave usando curvas Bézier
  const createSmoothPath = (points: any[]) => {
    if (!points || points.length < 2) return '';
    
    let path = `M ${points[0]?.x || 0} ${points[0]?.y || 0}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      if (!prev || !curr) continue;
      
      // Control points para curva suave
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpy1 = prev.y;
      const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
      const cpy2 = curr.y;
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  const actualPath = createSmoothPath(actualPoints);
  const expectedPath = createSmoothPath(expectedPoints);

  // Crear área bajo la curva para ingresos reales
  const actualAreaPath = actualPath + 
    ` L ${actualPoints[actualPoints.length - 1]?.x || 0} ${chartHeight - padding.bottom}` +
    ` L ${actualPoints[0]?.x || 0} ${chartHeight - padding.bottom} Z`;

  // Líneas de grid
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    y: padding.top + (chartHeight - padding.top - padding.bottom) * ratio,
    value: Math.round(maxAmount * (1 - ratio))
  }));

  console.log('✅ ModernChartFixed: Paths generados, renderizando SVG');

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-white z-10">
        <h3 className="text-lg font-semibold text-gray-800">Ingresos de este año</h3>
        <p className="text-sm text-gray-600">Máximo: €{maxAmount.toLocaleString()}</p>
      </div>

      {/* SVG Chart */}
      <div className="pt-16 pb-4 px-4 h-full">
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
          style={{ minHeight: '250px' }}
        >
          <defs>
            {/* Gradientes modernos */}
            <linearGradient id="actualAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            
            <linearGradient id="actualLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            
            <linearGradient id="expectedLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Grid horizontal */}
          {gridLines.map((line, index) => (
            <g key={index}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={chartWidth - padding.right}
                y2={line.y}
                stroke="#f1f5f9"
                strokeWidth="0.5"
                opacity="0.7"
              />
              {/* Etiquetas del eje Y */}
              <text
                x={padding.left - 2}
                y={line.y + 1}
                textAnchor="end"
                className="text-xs fill-gray-400"
                fontSize="3"
              >
                €{line.value.toLocaleString()}
              </text>
            </g>
          ))}

          {/* Área bajo la curva de ingresos reales */}
          <motion.path
            d={actualAreaPath}
            fill="url(#actualAreaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* Línea de ingresos potenciales (esperados) */}
          <motion.path
            d={expectedPath}
            fill="none"
            stroke="url(#expectedLineGradient)"
            strokeWidth="2"
            strokeDasharray="4,3"
            opacity="0.8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.2 }}
          />

          {/* Línea de ingresos reales */}
          <motion.path
            d={actualPath}
            fill="none"
            stroke="url(#actualLineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Puntos de datos modernos */}
          {actualPoints.map((point, index) => (
            <g key={`actual-${index}`}>
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth="2"
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: 3, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 * index + 1 }}
              />
              
              {/* Indicador de mes actual con animación */}
              {point.isCurrentMonth && (
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  opacity="0.6"
                  initial={{ r: 3, opacity: 0 }}
                  animate={{ 
                    r: [6, 8, 6],
                    opacity: [0.6, 0.3, 0.6]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    delay: 0.1 * index + 1.5
                  }}
                />
              )}
              
              {/* Tooltip invisible para hover */}
              <circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="transparent"
                className="cursor-pointer"
              >
                <title>
                  {point.month}: €{point.value.toLocaleString()}
                  {point.isCurrentMonth && ' (Mes actual)'}
                </title>
              </circle>
            </g>
          ))}

          {/* Puntos de ingresos potenciales */}
          {expectedPoints.map((point, index) => (
            <motion.circle
              key={`expected-${index}`}
              cx={point.x}
              cy={point.y}
              r="2"
              fill="#6366f1"
              opacity="0.7"
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: 2, opacity: 0.7 }}
              transition={{ duration: 0.3, delay: 0.1 * index + 1.2 }}
            >
              <title>Potencial {data[index]?.month || ''}: €{point.value.toLocaleString()}</title>
            </motion.circle>
          ))}

          {/* Etiquetas de meses */}
          {actualPoints.map((point, index) => (
            <motion.text
              key={`month-${index}`}
              x={point.x}
              y={chartHeight - padding.bottom + 8}
              textAnchor="middle"
              className={`text-xs font-medium ${
                point.isCurrentMonth
                  ? 'fill-emerald-600 font-bold'
                  : point.isFutureMonth
                  ? 'fill-gray-300'
                  : 'fill-gray-500'
              }`}
              fontSize="3.5"
              initial={{ opacity: 0, y: chartHeight - padding.bottom + 12 }}
              animate={{ opacity: 1, y: chartHeight - padding.bottom + 8 }}
              transition={{ duration: 0.3, delay: 0.1 * index + 0.5 }}
            >
              {point.month}
            </motion.text>
          ))}
        </svg>
      </div>

      {/* Leyenda moderna flotante */}
      <motion.div 
        className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-100"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 2 }}
      >
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded"></div>
            <span className="text-gray-700 font-medium">Ingresos Reales</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #6366f1 0, #6366f1 2px, transparent 2px, transparent 4px)'
              }}
            ></div>
            <span className="text-gray-700 font-medium">Ingresos Potenciales</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}