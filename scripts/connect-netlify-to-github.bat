@echo off
echo 🔗 CONECTAR NETLIFY A GITHUB - GUÍA PASO A PASO
echo ===============================================

echo.
echo 🎯 OBJETIVO: Desconectar de Lovable y conectar a tu GitHub

echo.
echo 📋 PASOS EXACTOS:

echo.
echo 🌐 1. IR A NETLIFY:
echo    Ve a: https://app.netlify.com/
echo    Login con tu cuenta

echo.
echo 🔍 2. ENCONTRAR TU SITIO:
echo    Busca el sitio que usa www.rentaflux.com
echo    (Puede aparecer como "rentaflux" o similar)

echo.
echo ⚙️ 3. CAMBIAR REPOSITORIO:
echo    • Clic en tu sitio
echo    • Site settings (botón en la parte superior)
echo    • Build & deploy (menú izquierdo)
echo    • Repository (sección)
echo    • "Link to a different repository" o "Change repository"

echo.
echo 🔗 4. CONECTAR A GITHUB:
echo    • Selecciona GitHub
echo    • Busca tu repositorio (probablemente "depositdigest")
echo    • Branch: main
echo    • Build command: npm run build
echo    • Publish directory: dist

echo.
echo ✅ 5. CONFIGURACIÓN AUTOMÁTICA:
echo    Netlify debería detectar automáticamente:
echo    • El archivo netlify.toml
echo    • Las configuraciones de build
echo    • Los redirects configurados

echo.
echo 🚀 6. DEPLOY AUTOMÁTICO:
echo    Después de conectar, Netlify hará un deploy automático
echo    En 2-5 minutos, www.rentaflux.com debería mostrar:
echo    • Landing como página principal
echo    • ChatAssistant Pro
echo    • Formulario de inquilinos mejorado

echo.
echo 🆘 SI NO ENCUENTRAS EL SITIO:
echo    Ejecuta: scripts\create-new-netlify-site.bat
echo    Para crear un sitio completamente nuevo

echo.
echo 💡 VERIFICACIÓN:
echo    Después del deploy, visita www.rentaflux.com
echo    Deberías ver todas nuestras mejoras

echo.
pause