@echo off
echo 🔍 VERIFICADOR DE SECRETS DE GITHUB
echo ==================================

echo.
echo 📋 CHECKLIST DE SECRETS REQUERIDOS:
echo.
echo ✅ 1. NETLIFY_AUTH_TOKEN
echo    📍 Ubicación: Netlify > User Settings > Applications > Personal Access Tokens
echo    🎯 Formato: Empieza con "nfp_" seguido de caracteres aleatorios
echo.
echo ✅ 2. NETLIFY_SITE_ID  
echo    📍 Ubicación: Netlify > Tu Sitio > Site Settings > General > Site Information
echo    🎯 Formato: UUID como "12345678-1234-1234-1234-123456789abc"
echo.
echo ✅ 3. IONIC_TOKEN
echo    📍 Ubicación: Ionic.io > Personal Settings > Personal Access Tokens
echo    🎯 Formato: Token largo con letras y números
echo.
echo 🔐 DÓNDE AGREGARLOS EN GITHUB:
echo 1. Tu repo > Settings > Secrets and variables > Actions
echo 2. Clic "New repository secret" (NO environment secrets)
echo 3. Agrega cada secret con el nombre exacto
echo.
echo ⚠️ IMPORTANTE:
echo • Los nombres deben ser EXACTOS (mayúsculas y guiones bajos)
echo • Los tokens solo se muestran UNA VEZ al crearlos
echo • Si pierdes un token, genera uno nuevo
echo.
echo 🧪 PARA PROBAR:
echo Después de configurar los secrets, haz:
echo git add .
echo git commit -m "Test auto-deploy"
echo git push origin main
echo.
echo 📊 VERIFICAR FUNCIONAMIENTO:
echo • Ve a GitHub > Actions para ver si el workflow se ejecuta
echo • Revisa www.rentaflux.com para ver si se actualiza
echo.
pause