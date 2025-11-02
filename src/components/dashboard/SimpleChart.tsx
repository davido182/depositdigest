// Componente de gráfico simple para debugging

interface SimpleChartProps {
  data: any[];
}

export function SimpleChart({ data }: SimpleChartProps) {
  console.log('🔍 SimpleChart: Datos recibidos:', data);
  
  if (!data || data.length === 0) {
    console.log('❌ SimpleChart: No hay datos');
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 text-lg">📊 No hay datos disponibles</p>
          <p className="text-gray-400 text-sm mt-2">El gráfico aparecerá cuando haya datos</p>
        </div>
      </div>
    );
  }

  console.log('✅ SimpleChart: Renderizando con', data.length, 'puntos de datos');

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Ingresos de este año</h3>
        <p className="text-sm text-gray-600">Datos de prueba - {data.length} meses</p>
      </div>
      
      {/* Gráfico simple con barras CSS */}
      <div className="flex items-end justify-between h-48 bg-gray-50 rounded p-4">
        {data.map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.actual || 0));
          const height = maxValue > 0 ? (item.actual / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 mx-1">
              {/* Barra */}
              <div 
                className="w-full bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600"
                style={{ 
                  height: `${Math.max(height, 2)}%`,
                  minHeight: '4px'
                }}
                title={`${item.month}: €${item.actual?.toLocaleString() || 0}`}
              />
              
              {/* Etiqueta del mes */}
              <div className="mt-2 text-xs text-gray-600 text-center">
                {item.month}
              </div>
              
              {/* Valor */}
              <div className="text-xs text-gray-500 mt-1">
                €{item.actual?.toLocaleString() || 0}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Leyenda */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 bg-emerald-500 rounded"></div>
          <span>Ingresos Reales</span>
        </div>
      </div>
      
      {/* Debug info */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <strong>Debug:</strong> {data.length} meses, 
        Max: €{Math.max(...data.map(d => d.actual || 0)).toLocaleString()},
        Total: €{data.reduce((sum, d) => sum + (d.actual || 0), 0).toLocaleString()}
      </div>
    </div>
  );
}