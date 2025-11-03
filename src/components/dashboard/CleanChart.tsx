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

  // LÓGICA CORREGIDA: El máximo del eje Y debe ser el valor del potencial (constante)
  // La barra azul siempre será del 100% de altura (potencial completo)
  // La barra verde será proporcional a su valor real vs el potencial
  const potentialValue = data.length > 0 ? (data[0]?.expected || 0) : 0;
  const maxValue = potentialValue; // El eje Y va de 0 al potencial máximo

  console.log('📊 DEBUG CleanChart:', {
    potentialValue,
    maxValue,
    firstItemExpected: data[0]?.expected,
    firstItemActual: data[0]?.actual,
    dataLength: data.length
  });

  return (
    <div className="w-full h-full">
      {/* Header con leyenda - centrado y con más espacio */}
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4"> <br /> 📈 Ingresos de este año</h3>
        <div className="flex justify-center gap-8 text-sm mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">Ingresos Reales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-300/60 rounded-full"></div>
            <span className="text-gray-600">Esperado este mes</span>
          </div>
        </div>
      </div>

      {/* Gráfico ajustado para coincidir exactamente con la altura de las tarjetas laterales */}
      <div className="h-64">
        <div className="relative h-full bg-gradient-to-t from-gray-50 to-white rounded-lg p-4">

          {/* Eje Y transparente con valores */}
          <div className="absolute left-2 top-4 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
            {(() => {
              const steps = 5; // 5 líneas horizontales
              const yAxisValues = [];
              for (let i = steps; i >= 0; i--) {
                const value = (maxValue / steps) * i;
                yAxisValues.push(
                  <div key={i} className="relative">
                    <span className="absolute -left-1 -top-2">€{Math.round(value).toLocaleString()}</span>
                    {/* Línea horizontal transparente */}
                    <div className="absolute left-6 top-0 right-0 h-px bg-gray-200/50"></div>
                  </div>
                );
              }
              return yAxisValues;
            })()}
          </div>

          {/* Área de barras con margen para el eje Y */}
          <div className="ml-10 h-full flex items-end justify-between relative">
            {data.map((item, index) => {
              // Altura proporcional basada en el eje Y
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
                        className="absolute bottom-0 w-full bg-blue-300/30 rounded-t"
                        style={{
                          height: `${Math.max(expectedHeightPercent, 2)}%`,
                          minHeight: '4px'
                        }}
                      />

                      {/* Barra verde (real) - ENCIMA y centrada */}
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all duration-700 ${item.isCurrentMonth
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
                        <div className="font-bold">Ingresos Reales: €{item.actual.toLocaleString()}</div>
                        <div className="text-blue-300 text-xs">Potencial Total: €{item.expected.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Etiqueta del mes (Eje X) */}
                  <div className={`text-xs text-center ${item.isCurrentMonth
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
      </div>

    </div>
  );
}