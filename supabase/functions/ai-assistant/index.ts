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
    
    // Get Perplexity API key from environment
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    // Create context from user data
    const context = `
Contexto del usuario:
- Tiene ${userData.tenants?.length || 0} inquilinos
- Total de unidades: ${userData.tenants?.map((t: any) => t.unit_number).join(', ') || 'ninguna'}
- Últimos pagos: ${userData.payments?.slice(0, 3).map((p: any) => `$${p.amount} el ${p.payment_date}`).join(', ') || 'ninguno'}
- Solicitudes de mantenimiento: ${userData.maintenance?.length || 0}

Datos específicos:
${JSON.stringify(userData, null, 2)}
`;

    const systemPrompt = `Eres un asistente inteligente para RentFlow, una aplicación de gestión de propiedades de alquiler. 

Tu trabajo es ayudar al usuario a:
1. Encontrar información específica sobre sus inquilinos, pagos y mantenimiento
2. Analizar tendencias en sus datos
3. Responder preguntas sobre gestión de propiedades
4. Dar consejos prácticos sobre administración de alquileres

IMPORTANTE: 
- Solo responde sobre temas relacionados con gestión de propiedades, inquilinos, pagos y mantenimiento
- Si te preguntan sobre otros temas, amablemente redirige la conversación a temas de gestión de propiedades
- Usa los datos del contexto para dar respuestas específicas y personalizadas
- Responde en español de manera amigable y profesional
- No generes código ni realices tareas técnicas

Si no tienes información suficiente en el contexto, di que necesitas más datos específicos.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
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
        top_p: 0.9,
        max_tokens: 800,
        return_images: false,
        return_related_questions: false,
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
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
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});