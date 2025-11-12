# Instrucciones para Desplegar Cambios

## Cambios Realizados

### 1. ✅ Arreglado: No se puede usar espacio en nombres de inquilinos
- **Archivo**: `src/components/tenants/TenantEditForm.tsx`
- **Cambio**: Ahora puedes usar espacios libremente al editar nombres
- **Acción**: No requiere despliegue, ya funciona en local

### 2. ✅ Arreglado: Chat no muestra pagos pendientes de meses anteriores
- **Archivo**: `supabase/functions/ai-assistant/index.ts`
- **Cambio**: El AI ahora tiene una vista clara de pagos pendientes por mes
- **Acción**: REQUIERE DESPLIEGUE A SUPABASE

### 3. ✅ Mejorado: Dashboard ahora muestra pagos vencidos de meses anteriores
- **Archivo**: `src/components/dashboard/FinalDashboard.tsx`
- **Cambio**: La tarjeta de pagos ahora separa:
  - 📅 Pagos pendientes del mes actual (naranja)
  - ⏰ Pagos vencidos de meses anteriores (rojo)
- **Acción**: No requiere despliegue, ya funciona en local

## Cómo Desplegar la Función del Chat

### Opción 1: Usando Supabase CLI (Recomendado)

```bash
# 1. Asegúrate de tener Supabase CLI instalado
npm install -g supabase

# 2. Inicia sesión en Supabase
supabase login

# 3. Vincula tu proyecto (solo la primera vez)
supabase link --project-ref TU_PROJECT_REF

# 4. Despliega la función
supabase functions deploy ai-assistant
```

### Opción 2: Desde el Dashboard de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Edge Functions" en el menú lateral
4. Busca la función "ai-assistant"
5. Haz clic en "Edit Function"
6. Copia y pega el contenido de `supabase/functions/ai-assistant/index.ts`
7. Haz clic en "Deploy"

## Verificar que Funciona

### 1. Probar el Nombre con Espacios
1. Ve a "Inquilinos"
2. Haz clic en editar un inquilino
3. Intenta cambiar el nombre a "Juan Pérez" (con espacio)
4. Debería funcionar sin problemas ✅

### 2. Verificar Dashboard con Pagos Vencidos
1. Ve al Dashboard
2. Busca la tarjeta "🔔 Estado de Pagos"
3. Deberías ver:
   - Número total de pagos pendientes
   - Separación entre pagos del mes actual (naranja) y vencidos (rojo)
   - Si todo está al día, verás un mensaje verde ✅

### 3. Verificar Chat Assistant (después de desplegar)
1. Abre el chat assistant
2. Pregunta: "¿Tengo pagos pendientes de meses anteriores?"
3. El chat debería listar TODOS los meses con pagos pendientes con nombres y montos específicos
