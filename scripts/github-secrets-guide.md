# 🔐 GUÍA COMPLETA: CONFIGURAR SECRETS EN GITHUB

## 📍 UBICACIÓN EXACTA:
1. Ve a tu repositorio en GitHub
2. Clic en **Settings** (pestaña superior)
3. En el menú izquierdo: **Secrets and variables** > **Actions**
4. Clic en **"New repository secret"** (botón verde)

## 🔑 SECRETS QUE NECESITAS CREAR:

### **1. NETLIFY_AUTH_TOKEN**
**¿Dónde obtenerlo?**
1. Ve a: https://app.netlify.com/
2. Clic en tu avatar (esquina superior derecha)
3. **User settings**
4. **Applications** (menú izquierdo)
5. **Personal access tokens**
6. **New access token**
7. Nombre: "GitHub Actions"
8. **Generate token**
9. **COPIA EL TOKEN** (solo se muestra una vez)

**En GitHub:**
- Name: `NETLIFY_AUTH_TOKEN`
- Secret: [pega el token que copiaste]

### **2. NETLIFY_SITE_ID**
**¿Dónde obtenerlo?**
1. Ve a: https://app.netlify.com/
2. Clic en tu sitio (rentaflux)
3. **Site settings**
4. **General** (ya debería estar ahí)
5. Busca **"Site information"**
6. **Site ID** (algo como: `abc123def-456g-789h-012i-345jklmnopqr`)
7. **COPIA EL SITE ID**

**En GitHub:**
- Name: `NETLIFY_SITE_ID`
- Secret: [pega el Site ID]

### **3. IONIC_TOKEN**
**¿Dónde obtenerlo?**
1. Ve a: https://ionic.io/
2. Login con tu cuenta
3. Clic en tu avatar (esquina superior derecha)
4. **Personal Settings**
5. **Personal Access Tokens**
6. **Generate new token**
7. Nombre: "GitHub Actions"
8. **Generate token**
9. **COPIA EL TOKEN**

**En GitHub:**
- Name: `IONIC_TOKEN`
- Secret: [pega el token de Ionic]

## ✅ VERIFICACIÓN:
Después de crear los 3 secrets, deberías ver:
- NETLIFY_AUTH_TOKEN ✅
- NETLIFY_SITE_ID ✅  
- IONIC_TOKEN ✅

## 🚀 SIGUIENTE PASO:
Una vez configurados los secrets, haz un push para activar el auto-deploy:
```bash
git add .
git commit -m "🚀 Activar auto-deploy con secrets configurados"
git push origin main
```