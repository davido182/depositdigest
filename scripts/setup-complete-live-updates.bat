@echo off
echo 🚀 CONFIGURANDO LIVE UPDATES COMPLETOS
echo =====================================

echo.
echo ✅ Configuraciones aplicadas:
echo • GitHub Actions para auto-deploy
echo • Netlify redirige / a /landing
echo • Router simplificado para Landing principal
echo • Live Updates integrados

echo.
echo 📋 PASOS MANUALES REQUERIDOS:

echo.
echo 🔐 1. CONFIGURAR SECRETS EN GITHUB:
echo    Ve a: https://github.com/tu-usuario/tu-repo/settings/secrets/actions
echo    Agrega estos secrets:
echo    • NETLIFY_AUTH_TOKEN (desde Netlify > User Settings > Applications)
echo    • NETLIFY_SITE_ID (desde tu sitio en Netlify > Site Settings > General)
echo    • IONIC_TOKEN (desde Ionic Cloud > Personal Access Tokens)

echo.
echo 🌐 2. VERIFICAR NETLIFY:
echo    • Tu sitio: www.rentaflux.com
echo    • Ahora / redirige automáticamente a /landing
echo    • Los cambios en main se despliegan automáticamente

echo.
echo 📱 3. LIVE UPDATES MÓVILES:
echo    • Genera tu APK: generar-apk-final.bat
echo    • Los usuarios recibirán actualizaciones automáticamente
echo    • Sin necesidad de nueva APK para cambios de contenido

echo.
echo 🔄 4. FLUJO AUTOMÁTICO:
echo    1. Haces cambios en tu código
echo    2. Push a GitHub (rama main)
echo    3. GitHub Actions despliega a Netlify automáticamente
echo    4. www.rentaflux.com se actualiza
echo    5. Apps móviles reciben Live Updates

echo.
echo ✅ PRÓXIMOS PASOS:
echo 1. Configura los secrets en GitHub
echo 2. Haz un push para probar el auto-deploy
echo 3. Verifica que www.rentaflux.com vaya a landing
echo 4. Genera APK final con Live Updates

echo.
pause