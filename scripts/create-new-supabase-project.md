# 🆕 CREAR NUEVO PROYECTO SUPABASE - GUÍA COMPLETA

## 🎯 OBJETIVO: Proyecto limpio sin conexión a Lovable

### 📋 PASO 1: CREAR PROYECTO NUEVO
1. **Ve a:** https://supabase.com/dashboard
2. **"New project"**
3. **Configuración:**
   - **Name:** RentaFlux-Production
   - **Database Password:** [genera una segura]
   - **Region:** Closest to your users
   - **Plan:** Free (por ahora)

### 📋 PASO 2: CONFIGURAR AUTHENTICATION
1. **Authentication** → **Settings**
2. **Site URL:** `https://www.rentaflux.com`
3. **Redirect URLs:**
   ```
   https://www.rentaflux.com
   https://www.rentaflux.com/login
   https://www.rentaflux.com/dashboard
   https://www.rentaflux.com/**
   ```
4. **Email confirmations:** ON (funcionará correctamente)

### 📋 PASO 3: COPIAR ESQUEMA DE BASE DE DATOS
1. **SQL Editor** en el proyecto nuevo
2. **Ejecutar el script de creación** (lo crearemos)

### 📋 PASO 4: OBTENER NUEVAS CREDENCIALES
1. **Settings** → **API**
2. **Copiar:**
   - **Project URL**
   - **anon public key**

### 📋 PASO 5: ACTUALIZAR VARIABLES DE ENTORNO
1. **Netlify** → **Environment variables**
2. **Actualizar:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### ✅ RESULTADO:
- ✅ Proyecto limpio sin Lovable
- ✅ Emails funcionando correctamente
- ✅ App y web usando la misma base de datos
- ✅ Sin conflictos de configuración