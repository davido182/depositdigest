// Componente de emergencia para mostrar datos básicos sin errores
interface EmergencyChartProps {
  data: any[];
}

export function EmergencyChart({ data }: EmergencyChartProps) {
  console.log('🚨 EmergencyChart: Renderizando componente de emergencia');
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Gráfico de Ingresos</h3>
          <p className="text-gray-500">Los datos aparecerán cuando tengas propiedades e inquilinos</p>
          <div className="mt-4 text-sm text-gray-400">
            <p>• Crea propiedades en la sección Propiedades</p>
            <p>• Agrega inquilinos a tus unidades</p>
            <p>• Los ingresos se mostrarán automáticamente</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular estadísticas básicas
  const totalActual = data.reduce((sum, item) => sum + (item.actual || 0), 0);
  const totalExpected = data.reduce((sum, item) => sum + (item.expected || 0), 0);
  const currentMonth = data.find(item => item.isCurrentMonth);
  const maxValue = Math.max(...data.map(d => Math.max(d.actual || 0, d.expected || 0)));

  return (
    <div className="w-full h-full min-h-[300px] bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">📈 Ingresos de este año</h3>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">Total Real: <strong>€{totalActual.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Total Esperado: <strong>€{totalExpected.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Gráfico de barras mejorado */}
      <div className="mb-4">
        <div className="flex items-end justify-between h-48 bg-gradient-to-t from-gray-50 to-white rounded-lg p-4 border relative group">
          {data.map((item, index) => {
            const actualHeight = maxValue > 0 ? (item.actual / maxValue) * 100 : 0;
            const expectedHeight = maxValue > 0 ? (item.expected / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 mx-1 relative group">
                {/* Barra con fondo transparente */}
                <div className="relative w-full flex justify-center mb-2 cursor-pointer">
                  {/* Barra de fondo (esperado) - transparente */}
                  <div 
                    className="w-6 bg-gray-200 rounded-t relative hover:bg-gray-300 transition-colors"
                    style={{ 
                      height: `${Math.max(expectedHeight, 2)}%`,
                      minHeight: '4px'
                    }}
                  >
                    {/* Barra real encima */}
                    <div 
                      className={`absolute bottom-0 left-0 w-full rounded-t transition-all duration-700 ${
                        item.isCurrentMonth 
                          ? 'bg-emerald-600 shadow-lg' 
                          : 'bg-emerald-500'
                      } hover:brightness-110`}
                      style={{ 
                        height: `${Math.min((actualHeight / expectedHeight) * 100, 100)}%`,
                        minHeight: actualHeight > 0 ? '4px' : '0px'
                      }}
                    />
                    
                    {/* Valor dinámico semitransparente */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div className="font-bold">€{item.actual.toLocaleString()}</div>
                      <div className="text-gray-300">de €{item.expected.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                
                {/* Etiqueta del mes - sin números */}
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

      {/* Información del mes actual - dentro del gráfico */}
      {(() => {
        const currentMonth = data.find(item => item.isCurrentMonth);
        return currentMonth ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-emerald-800 mb-2 text-sm">📅 {currentMonth.month} (Mes Actual)</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-600">Ingresos Reales:</span>
                <div className="font-bold text-emerald-700">€{currentMonth.actual.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Ingresos Esperados:</span>
                <div className="font-bold text-blue-700">€{currentMonth.expected.toLocaleString()}</div>
              </div>
            </div>
            
            {currentMonth.actual > 0 && currentMonth.expected > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-gray-600">Rendimiento:</span>
                <div className={`font-bold ${
                  currentMonth.actual >= currentMonth.expected 
                    ? 'text-emerald-600' 
                    : 'text-orange-600'
                }`}>
                  {((currentMonth.actual / currentMonth.expected) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        ) : null;
      })()}

      {/* Estadísticas del mes actual */}
      {currentMonth && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-800 mb-2">📅 {currentMonth.month} (Mes Actual)</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Ingresos Reales:</span>
              <div className="font-bold text-emerald-700">€{currentMonth.actual.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-600">Ingresos Esperados:</span>
              <div className="font-bold text-blue-700">€{currentMonth.expected.toLocaleString()}</div>
            </div>
          </div>
          
          {currentMonth.actual > 0 && currentMonth.expected > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">Rendimiento:</span>
              <div className={`font-bold ${
                currentMonth.actual >= currentMonth.expected 
                  ? 'text-emerald-600' 
                  : 'text-orange-600'
              }`}>
                {((currentMonth.actual / currentMonth.expected) * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug info removed for production */}
    </div>
  );
}