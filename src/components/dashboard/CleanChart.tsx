// Gráfico corregido DEFINITIVAMENTE
interface ChartDataPoint {
  month: string;
  actual: number;
  expected: number;
  isCurrentMonth: boolean;
  isFutureMonth: boolean;
}

interface CleanChartProps {
  data: ChartDataPoint[];
}

export function CleanChart({ data }: CleanChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Gráfico de Ingresos</h3>
          <p className="text-gray-500">Los datos aparecerán cuando tengas propiedades e inquilinos</p>
        </div>
      </div>
    );
  }

  // LÓGICA CORREGIDA: El máximo debe ser el valor esperado (que es constante para todos los meses)
  const maxValue = Math.max(...data.map(d => Math.max(d.expected || 0, d.actual || 0)));
  const totalActual = data.reduce((sum, item) => sum + (item.actual || 0), 0);
  const currentMonthData = data.find(item => item.isCurrentMonth);
  const expectedThisMonth = currentMonthData?.expected || 0;

  return (
    <div className="w-full h-full">
      {/* Header con leyenda */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">📈 Ingresos de este año</h3>
        <div className="flex gap-6 text-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">Ingresos Reales: <strong>€{totalActual.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-300/60 rounded-full"></div>
            <span className="text-gray-600">Esperado este mes: <strong>€{expectedThisMonth.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Gráfico con altura ajustada para coincidir con las tarjetas laterales */}
      <div className="h-72 mb-4">
        <div className="flex items-end justify-between h-full bg-gradient-to-t from-gray-50 to-white rounded-lg p-4 border relative">
          {data.map((item, index) => {
            // Altura proporcional basada en el eje Y imaginario
            const actualHeightPercent = maxValue > 0 ? (item.actual / maxValue) * 100 : 0;
            const expectedHeightPercent = maxValue > 0 ? (item.expected / maxValue) * 100 : 0;
            
            return (
              <div 
                key={index} 
                className="flex flex-col items-center flex-1 mx-1 relative group"
              >
                {/* Contenedor de barra */}
                <div className="relative w-full flex justify-center mb-2 cursor-pointer">
                  <div className="relative w-10 h-full flex justify-center">
                    {/* Barra azul transparente de fondo (esperado) - DETRÁS */}
                    <div 
                      className="absolute bottom-0 w-full bg-blue-300/40 rounded-t"
                      style={{ 
                        height: `${Math.max(expectedHeightPercent, 2)}%`,
                        minHeight: '4px'
                      }}
                    />
                    
                    {/* Barra verde (real) - ENCIMA y centrada */}
                    <div 
                      className={`absolute bottom-0 w-full rounded-t transition-all duration-700 ${
                        item.isCurrentMonth 
                          ? 'bg-emerald-600 shadow-lg' 
                          : 'bg-emerald-500'
                      }`}
                      style={{ 
                        height: `${Math.max(actualHeightPercent, 1)}%`,
                        minHeight: item.actual > 0 ? '4px' : '0px'
                      }}
                    />
                    
                    {/* Etiqueta semitransparente SIEMPRE visible */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-white/80 text-gray-700 px-1 py-0.5 rounded text-center whitespace-nowrap group-hover:opacity-0 transition-opacity">
                      €{item.actual.toLocaleString()}
                    </div>
                    
                    {/* Tooltip detallado en hover */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-xs bg-black/90 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                      <div className="font-bold">Real: €{item.actual.toLocaleString()}</div>
                      <div className="text-blue-300 text-xs">Potencial: €{item.expected.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                
                {/* Etiqueta del mes */}
                <div className={`text-xs text-center ${
                  item.isCurrentMonth 
                    ? 'font-bold text-emerald-600' 
                    : item.isFutureMonth 
                    ? 'text-gray-400' 
                    : 'text-gray-600'
                }`}>
                  {item.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
        
      {/* Información del mes actual - DENTRO del gráfico */}
      {(() => {
        const currentMonth = data.find(item => item.isCurrentMonth);
        return currentMonth ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <h4 className="font-semibold text-emerald-800 mb-2 text-sm">📅 {currentMonth.month} (Mes Actual)</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-600">Ingresos Reales:</span>
                <div className="font-bold text-emerald-700">€{currentMonth.actual.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Potencial Máximo:</span>
                <div className="font-bold text-blue-700">€{currentMonth.expected.toLocaleString()}</div>
              </div>
            </div>
            
            {currentMonth.expected > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-gray-600">Aprovechamiento:</span>
                <div className={`font-bold ${
                  (currentMonth.actual / currentMonth.expected) >= 0.9
                    ? 'text-emerald-600' 
                    : (currentMonth.actual / currentMonth.expected) >= 0.7
                    ? 'text-yellow-600'
                    : 'text-orange-600'
                }`}>
                  {((currentMonth.actual / currentMonth.expected) * 100).toFixed(1)}% del potencial
                </div>
              </div>
            )}
          </div>
        ) : null;
      })()}
    </div>
  );
}