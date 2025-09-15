# 🔄 ACTUALIZAR CREDENCIALES DE SUPABASE

## ✅ TU BASE DE DATOS YA ESTÁ LISTA
Las tablas ya existen con la estructura correcta:
- tenants ✅
- payments ✅  
- maintenance_requests ✅
- properties ✅
- units ✅
- Y muchas más...

## 🔧 SOLO NECESITAS ACTUALIZAR CREDENCIALES:

### 1. En tu nuevo proyecto de Supabase:
- **Settings** → **API**
- **Copia:**
  - Project URL
  - anon public key

### 2. En Netlify:
- **Site settings** → **Environment variables**
- **Actualizar:**
  - `VITE_SUPABASE_URL` = tu nueva URL
  - `VITE_SUPABASE_ANON_KEY` = tu nueva clave

### 3. Trigger deploy:
- **Deploys** → **Trigger deploy**

## 🎯 RESULTADO:
- ✅ Base de datos limpia y funcional
- ✅ Sin conexión a Lovable
- ✅ Emails funcionando correctamente
- ✅ App y web usando la misma DB