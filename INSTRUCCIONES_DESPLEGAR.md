# 🚀 Cómo Desplegar la Edge Function

## ✅ OPCIÓN 1: Desde el Dashboard (MÁS FÁCIL - RECOMENDADO)

### Paso 1: Ir al Dashboard
1. Abre tu navegador
2. Ve a: **https://supabase.com/dashboard**
3. Inicia sesión si no lo has hecho

### Paso 2: Seleccionar tu proyecto
1. Verás una lista de tus proyectos
2. Haz clic en el proyecto de **RentaFlux**

### Paso 3: Ir a Edge Functions
1. En el menú lateral izquierdo, busca **"Edge Functions"**
2. Haz clic en **"Edge Functions"**

### Paso 4: Editar la función
1. Verás una lista de funciones
2. Busca **"ai-assistant"**
3. Haz clic en **"ai-assistant"**

### Paso 5: Actualizar el código
1. Verás un editor de código
2. **BORRA TODO** el código que está ahí
3. Abre el archivo: `supabase/functions/ai-assistant/index.ts` en tu proyecto
4. **COPIA TODO** el contenido de ese archivo
5. **PEGA** el código en el editor del dashboard
6. Haz clic en **"Deploy"** o **"Save & Deploy"** (botón azul arriba a la derecha)

### Paso 6: Esperar
1. Espera 30-60 segundos
2. Verás un mensaje de éxito

### Paso 7: Probar
1. Ve a tu aplicación RentaFlux
2. Abre el chat del asistente
3. Escribe cualquier pregunta
4. ¡Debería funcionar!

---

## 🔧 OPCIÓN 2: Usando PowerShell Script (Windows)

### Paso 1: Abrir PowerShell como Administrador
1. Presiona **Windows + X**
2. Selecciona **"Windows PowerShell (Admin)"** o **"Terminal (Admin)"**

### Paso 2: Permitir ejecución de scripts
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Paso 3: Ir a tu proyecto
```powershell
cd C:\Users\Issues\Desktop\RentafluxKiro\depositdigest
```

### Paso 4: Ejecutar el script
```powershell
.\deploy-edge-function.ps1
```

### Paso 5: Seguir las instrucciones
1. El script instalará Supabase CLI si no lo tienes
2. Te pedirá que inicies sesión (se abrirá tu navegador)
3. Te pedirá tu **Project Reference ID**
   - Lo encuentras en: Supabase Dashboard > Settings > General > Reference ID
   - Se ve algo así: `abcdefghijklmnop`
4. Copialo y pégalo en la terminal
5. Presiona Enter
6. El script desplegará la función automáticamente

---

## 🆘 Si tienes problemas

### Error: "CEREBRAS_API_KEY not configured"
1. Ve a Supabase Dashboard
2. Edge Functions > Settings > Secrets
3. Verifica que existe: `CEREBRAS_API_KEY`
4. Si no existe, agrégala con tu API key de Cerebras

### Error: "Function not found"
1. Verifica que la función existe en: `supabase/functions/ai-assistant/`
2. Si no existe, crea la carpeta y el archivo `index.ts`

### El chat no responde
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Copia el error y dímelo

---

## 📝 Notas Importantes

- La API key de Cerebras debe estar en **Supabase Edge Function Secrets**, NO en variables de entorno de Netlify
- Después de agregar el secret, DEBES redesplegar la función
- Los cambios pueden tardar 1-2 minutos en propagarse
- Si usas la Opción 1 (Dashboard), es instantáneo

---

## ✅ Verificar que funcionó

1. Ve a tu app RentaFlux
2. Abre el chat
3. Escribe: "Hola"
4. Si responde algo coherente (no un error), ¡funcionó!
5. Prueba con: "¿Cuántos inquilinos tengo?"
6. Debería darte una respuesta inteligente basada en tus datos
