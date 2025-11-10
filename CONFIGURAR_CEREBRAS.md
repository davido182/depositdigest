# 🔧 Configurar API de Cerebras

## Paso 1: Configurar en Supabase Edge Functions

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Ve a **Edge Functions** en el menú lateral
3. Haz clic en **Settings** o **Secrets**
4. Agrega un nuevo secret:
   - **Nombre:** `CEREBRAS_API_KEY`
   - **Valor:** Tu API key de Cerebras (la que obtuviste de https://cerebras.ai)

## Paso 2: Desplegar la Edge Function

Ejecuta en tu terminal:

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login a Supabase
supabase login

# Link a tu proyecto
supabase link --project-ref TU_PROJECT_REF

# Desplegar la función
supabase functions deploy ai-assistant
```

## Paso 3: Verificar que funciona

1. Abre la consola del navegador (F12)
2. Ve al chat del asistente
3. Escribe cualquier pregunta
4. Revisa los logs en la consola para ver si hay errores

## Alternativa: Configurar en Netlify (si usas Netlify)

1. Ve a tu sitio en Netlify
2. Ve a **Site settings** > **Environment variables**
3. Agrega:
   - **Key:** `CEREBRAS_API_KEY`
   - **Value:** Tu API key de Cerebras

## Verificar tu API Key de Cerebras

Tu API key debe verse algo así:
```
csk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Si no la tienes:
1. Ve a https://cerebras.ai
2. Inicia sesión
3. Ve a **API Keys**
4. Copia tu key

## Troubleshooting

Si ves el error "CEREBRAS_API_KEY not configured":
- Verifica que agregaste el secret en Supabase
- Verifica que el nombre sea exactamente `CEREBRAS_API_KEY`
- Redespliega la Edge Function después de agregar el secret
- Espera 1-2 minutos para que se propague

Si ves "Cerebras API error: 401":
- Tu API key es inválida o expiró
- Genera una nueva en https://cerebras.ai

Si ves "Cerebras API error: 429":
- Has excedido el límite de requests
- Espera unos minutos o actualiza tu plan
