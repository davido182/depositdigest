import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userData } = await req.json();
    
    // Get Cerebras API key from environment
    const cerebrasApiKey = Deno.env.get('CEREBRAS_API_KEY') || 
                          Deno.env.get('VITE_CEREBRAS_API_KEY') ||
                          Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!cerebrasApiKey) {
      console.error('CEREBRAS_API_KEY not found in environment');
      return new Response(JSON.stringify({ 
        error: 'CEREBRAS_API_KEY not configured',
        success: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create context from user data
    const paymentRecords = userData.paymentRecords || [];
    const currentMonth = new Date().getMonth();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Calcular estadísticas útiles
    const activeTenants = userData.tenants?.filter((t: any) => t.status === 'active') || [];
    const totalMonthlyIncome = activeTenants.reduce((sum: number, t: any) => sum + (t.rent_amount || 0), 0);
    const occupiedUnits = userData.units?.filter((u: any) => !u.is_available).length || 0;
    const occupancyRate = userData.units?.length > 0 ? ((occupiedUnits / userData.units.length) * 100).toFixed(0) : 0;
    
    const context = `
═══════════════════════════════════════════════════════════
DATOS COMPLETOS DEL USUARIO - RENTAFLUX
═══════════════════════════════════════════════════════════

📊 RESUMEN GENERAL:
- Inquilinos activos: ${activeTenants.length}
- Ingresos mensuales potenciales: €${totalMonthlyIncome}
- Ocupación: ${occupancyRate}% (${occupiedUnits}/${userData.units?.length || 0} unidades)
- Propiedades: ${userData.properties?.length || 0}

👥 INQUILINOS ACTIVOS (${activeTenants.length}):
${activeTenants.length > 0 ? activeTenants.map((t: any) => {
  const startDate = t.lease_start_date ? new Date(t.lease_start_date).toLocaleDateString('es-ES') : 'N/A';
  return `• ${t.name}
  - Unidad: ${t.unit_number}
  - Renta: €${t.rent_amount}/mes
  - Desde: ${startDate}
  - Email: ${t.email || 'N/A'}
  - Teléfono: ${t.phone || 'N/A'}`;
}).join('\n\n') : 'No hay inquilinos activos'}

💰 REGISTROS DE PAGOS (${paymentRecords.length} registros):
${paymentRecords.length > 0 ? paymentRecords.slice(0, 50).map((r: any) => 
  `${r.tenantName} | ${monthNames[r.month]} ${r.year} | ${r.paid ? '✅ PAGADO' : '❌ PENDIENTE'} | €${r.amount || 0}${r.paymentDate ? ` | Fecha: ${r.paymentDate}` : ''}`
).join('\n') : 'No hay registros de pago en la tabla de seguimiento'}

🏠 UNIDADES (${userData.units?.length || 0}):
${userData.units?.length > 0 ? userData.units.map((u: any) => 
  `• Unidad ${u.unit_number}: ${u.is_available ? '🟢 Disponible' : '🔴 Ocupada'} - €${u.rent_amount}/mes`
).join('\n') : 'Sin unidades'}

🏢 PROPIEDADES (${userData.properties?.length || 0}):
${userData.properties?.length > 0 ? userData.properties.map((p: any) => 
  `• ${p.name}
  - Dirección: ${p.address}
  - Tipo: ${p.type || 'N/A'}
  - Unidades: ${p.units_count}`
).join('\n\n') : 'Sin propiedades'}

🔧 MANTENIMIENTO (${userData.maintenance?.length || 0}):
${userData.maintenance?.length > 0 ? userData.maintenance.slice(0, 10).map((m: any) => 
  `• ${m.title} - Estado: ${m.status} - Prioridad: ${m.priority}`
).join('\n') : 'Sin solicitudes de mantenimiento'}

═══════════════════════════════════════════════════════════
USA ESTOS DATOS PARA RESPONDER DE FORMA INTELIGENTE
═══════════════════════════════════════════════════════════
`;

    const systemPrompt = `Eres un asistente inteligente para RentaFlux, una aplicación de gestión de propiedades de alquiler. 

CAPACIDADES:
Puedes ayudar con:
- Información sobre inquilinos (nombres, unidades, rentas, fechas de ingreso)
- Historial de pagos y análisis financiero
- Estado de ocupación de unidades
- Comparaciones entre inquilinos
- Análisis de tendencias y patrones
- Consejos personalizados de gestión
- Cálculos de ingresos y proyecciones
- Identificar pagos pendientes o atrasados

DATOS DISPONIBLES:
1. INQUILINOS: Nombre, unidad, renta mensual, estado, fecha de ingreso
2. REGISTROS DE PAGOS: Historial completo mes por mes de cada inquilino
   - ✅ PAGADO = El inquilino pagó ese mes
   - ❌ PENDIENTE = El inquilino NO ha pagado ese mes
3. UNIDADES: Número, disponibilidad, renta
4. PROPIEDADES: Nombre, dirección, cantidad de unidades
5. MANTENIMIENTO: Solicitudes y su estado

CÓMO RESPONDER:
- Analiza TODOS los datos disponibles en el contexto
- Da respuestas específicas con números y nombres reales
- Si preguntan por pagos, usa "REGISTROS DE PAGOS"
- Si preguntan por inquilinos, usa "INQUILINOS"
- Haz comparaciones y análisis cuando sea relevante
- Sé proactivo: sugiere insights útiles
- Responde en español de manera amigable y profesional
- Si falta información, di qué datos específicos necesitas

EJEMPLOS DE ANÁLISIS:
- "¿Quién debe dinero?" → Busca en REGISTROS DE PAGOS los que dicen ❌ PENDIENTE
- "¿Cuánto gano al mes?" → Suma las rentas de todos los inquilinos activos
- "¿Quién es mi mejor inquilino?" → Analiza historial de pagos y antigüedad
- "Compara María vs Juan" → Compara sus datos de renta, pagos, antigüedad

IMPORTANTE:
- NO inventes datos, solo usa lo que está en el contexto
- Si no hay datos, dilo claramente
- Sé específico con números, fechas y nombres`;

    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cerebrasApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [
          {
            role: 'system',
            content: systemPrompt + '\n\n' + context
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        top_p: 0.9
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cerebras API error:', response.status, errorText);
      
      return new Response(JSON.stringify({ 
        error: `Cerebras API error: ${response.status}`,
        details: errorText,
        success: false 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const assistantResponse = data.choices[0]?.message?.content || 'Lo siento, no pude procesar tu consulta en este momento.';

    return new Response(JSON.stringify({ 
      response: assistantResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
