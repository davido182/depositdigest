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
RESUMEN:
- Inquilinos activos: ${activeTenants.length}
- Ingresos mensuales: €${totalMonthlyIncome}
- Ocupación: ${occupancyRate}%

INQUILINOS (${activeTenants.length}):
${activeTenants.length > 0 ? activeTenants.map((t: any) => {
  const moveInDate = t.move_in_date || t.lease_start_date;
  const dateStr = moveInDate ? ` (desde ${moveInDate})` : '';
  return `${t.name} - Unidad ${t.unit_number} - €${t.rent_amount}/mes${dateStr}`;
}).join('\n') : 'Sin inquilinos'}

REGISTROS DE PAGOS (${paymentRecords.length}):
${paymentRecords.length > 0 ? paymentRecords.slice(0, 30).map((r: any) => 
  `${r.tenantName} | ${monthNames[r.month]} ${r.year} | ${r.paid ? 'PAGADO' : 'PENDIENTE'} | €${r.amount || 0}`
).join('\n') : 'Sin registros'}

UNIDADES (${userData.units?.length || 0}):
${userData.units?.length > 0 ? userData.units.slice(0, 10).map((u: any) => 
  `${u.unit_number}: ${u.is_available ? 'Disponible' : 'Ocupada'} - €${u.rent_amount}/mes`
).join('\n') : 'Sin unidades'}
`;

    const systemPrompt = `Eres un asistente de consulta para RentaFlux. Solo puedes CONSULTAR datos, NO puedes crear o modificar nada.

IMPORTANTE - GUÍA AL USUARIO:
Si preguntan cómo crear/agregar algo, responde EXACTAMENTE así:

"¿Cómo crear un inquilino?"
→ "Ve a la sección 'Inquilinos' en el menú lateral y haz clic en el botón '+' o 'Agregar Inquilino'. También puedes hacerlo desde el Dashboard."

"¿Cómo crear una propiedad?"
→ "Ve a la sección 'Propiedades' en el menú lateral y haz clic en 'Agregar Propiedad'."

"¿Cómo agregar una unidad?"
→ "Ve a 'Propiedades', selecciona la propiedad y haz clic en 'Agregar Unidad'."

"¿Cómo registrar un pago?"
→ "Ve a la sección 'Pagos' en el menú lateral y usa la tabla de seguimiento de pagos para marcar como pagado."

REGLAS:
- NUNCA digas que puedes crear/modificar datos
- NUNCA pidas datos para "crear" algo
- Solo GUÍA al usuario a la sección correcta
- Sé conciso (máximo 2-3 líneas)
- Responde en español

PARA CONSULTAS:
- Usa "REGISTROS DE PAGOS" para preguntas de pagos
- Usa "INQUILINOS" con sus fechas de ingreso para saber desde cuándo deben pagar
- Si un inquilino entró en marzo, NO debe pagos de enero-febrero (esos son N/A)
- Da respuestas directas y breves`;

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
        temperature: 0.2,
        max_tokens: 300,
        top_p: 0.8
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
