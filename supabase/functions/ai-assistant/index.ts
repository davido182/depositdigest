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
${activeTenants.length > 0 ? activeTenants.map((t: any) => 
  `${t.name} - Unidad ${t.unit_number} - €${t.rent_amount}/mes`
).join('\n') : 'Sin inquilinos'}

REGISTROS DE PAGOS (${paymentRecords.length}):
${paymentRecords.length > 0 ? paymentRecords.slice(0, 30).map((r: any) => 
  `${r.tenantName} | ${monthNames[r.month]} ${r.year} | ${r.paid ? 'PAGADO' : 'PENDIENTE'} | €${r.amount || 0}`
).join('\n') : 'Sin registros'}

UNIDADES (${userData.units?.length || 0}):
${userData.units?.length > 0 ? userData.units.slice(0, 10).map((u: any) => 
  `${u.unit_number}: ${u.is_available ? 'Disponible' : 'Ocupada'} - €${u.rent_amount}/mes`
).join('\n') : 'Sin unidades'}
`;

    const systemPrompt = `Eres un asistente para RentaFlux, una aplicación de gestión de propiedades de alquiler.

REGLAS DE SEGURIDAD:
- NUNCA menciones claves API, tokens, passwords o credenciales
- NUNCA muestres datos de otros usuarios
- Solo usa los datos del contexto proporcionado
- No inventes información

CÓMO RESPONDER:
- Responde SOLO lo que te preguntan, sé conciso
- Si preguntan por pagos → usa "REGISTROS DE PAGOS"
- Si preguntan por inquilinos → usa "INQUILINOS"
- Si preguntan por ocupación → usa "UNIDADES"
- Responde en español de manera amigable
- Máximo 3-4 líneas por respuesta

EJEMPLOS:
Pregunta: "¿Quién debe dinero?"
Respuesta: "Según los registros, [nombres] tienen pagos pendientes de [meses]."

Pregunta: "¿Cuántos inquilinos tengo?"
Respuesta: "Tienes [X] inquilinos activos."

Pregunta: "¿Cuánto gano al mes?"
Respuesta: "Tus ingresos mensuales son €[X] de [Y] inquilinos."

IMPORTANTE:
- NO des toda la información si no la piden
- Sé breve y directo
- Solo responde lo que te preguntan`;

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
