// Gráfico limpio y corregido
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

  // Calcular el máximo para las barras esperadas (azules)
  const maxExpected = Math.max(...data.map(d => d.expected || 0));

  return (
    <div className="w-full h-full min-h-[300px] p-4">
      {/* Gráfico de barras limpio */}
      <div className="mb-4">
        <div className="flex items-end justify-between h-48 p-4 relative">
          {data.map((item, index) => {
            // Altura de la barra azul (esperado) basada en el máximo esperado
            const expectedHeight = maxExpected > 0 ? (item.expected / maxExpected) * 100 : 0;
            // Altura de la barra verde (real) basada en el máximo esperado también
            const actualHeight = maxExpected > 0 ? (item.actual / maxExpected) * 100 : 0;
            
            return (
              <div 
                key={index} 
                className="flex flex-col items-center flex-1 mx-1 relative group"
              >
                {/* Contenedor de barras */}
                <div className="relative w-full flex justify-center mb-2 cursor-pointer">
                  {/* Barra azul (esperado) - altura variable */}
                  <div 
                    className="w-6 bg-blue-200 rounded-t relative mr-1"
                    style={{ 
                      height: `${Math.max(expectedHeight, 2)}%`,
                      minHeight: '4px'
                    }}
                  />
                  
                  {/* Barra verde (real) - altura variable */}
                  <div 
                    className={`w-6 rounded-t relative ${
                      item.isCurrentMonth 
                        ? 'bg-emerald-600 shadow-lg' 
                        : 'bg-emerald-500'
                    }`}
                    style={{ 
                      height: `${Math.max(actualHeight, 2)}%`,
                      minHeight: '4px'
                    }}
                  >
                    {/* Etiqueta semitransparente siempre visible */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-white/80 text-gray-700 px-1 py-0.5 rounded text-center whitespace-nowrap group-hover:opacity-0 transition-opacity">
                      €{item.actual.toLocaleString()}
                    </div>
                    
                    {/* Tooltip detallado en hover */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-black/90 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                      <div className="font-bold">Real: €{item.actual.toLocaleString()}</div>
                      <div className="text-gray-300 text-xs">Esperado: €{item.expected.toLocaleString()}</div>
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
        
        {/* Información del mes actual - DENTRO del gráfico */}
        {(() => {
          const currentMonth = data.find(item => item.isCurrentMonth);
          return currentMonth ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-4">
              <h4 className="font-semibold text-emerald-800 mb-2 text-sm">📅 {currentMonth.month} (Mes Actual)</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-600">Ingresos Reales:</span>
                  <div className="font-bold text-emerald-700">€{currentMonth.actual.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Esperado este mes:</span>
                  <div className="font-bold text-blue-700">€{currentMonth.expected.toLocaleString()}</div>
                </div>
              </div>
              
              {currentMonth.expected > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-gray-600">Rendimiento:</span>
                  <div className={`font-bold ${
                    (currentMonth.actual / currentMonth.expected) >= 0.9
                      ? 'text-emerald-600' 
                      : (currentMonth.actual / currentMonth.expected) >= 0.7
                      ? 'text-yellow-600'
                      : 'text-orange-600'
                  }`}>
                    {((currentMonth.actual / currentMonth.expected) * 100).toFixed(1)}% del esperado
                  </div>
                </div>
              )}
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}