@echo off
echo 📊 MONITOREANDO DEPLOYMENT
echo =========================

echo.
echo ✅ NUEVO COMMIT ENVIADO
echo • Workflow de GitHub Actions arreglado
echo • Push completado exitosamente
echo • Deployment debería iniciarse automáticamente

echo.
echo 🔍 CÓMO MONITOREAR:

echo.
echo 1. 📊 GITHUB ACTIONS:
echo    URL: https://github.com/davido182/depositdigest/actions
echo    • Busca "Auto Deploy to Netlify"
echo    • Debería aparecer "in progress" o "completed"
echo    • Si falla, revisa los logs para ver el error

echo.
echo 2. 🌐 NETLIFY:
echo    URL: https://app.netlify.com/
echo    • Ve a tu sitio
echo    • Pestaña "Deploys"
echo    • Debería aparecer un nuevo deploy automático

echo.
echo 3. 🏠 SITIO WEB:
echo    URL: www.rentaflux.com
echo    • Debería cargar el Landing automáticamente
echo    • Si no funciona, espera unos minutos más

echo.
echo ⏱️ TIEMPOS ESTIMADOS:
echo • GitHub Actions: 3-5 minutos
echo • Netlify Deploy: 1-2 minutos
echo • Total: 5-7 minutos máximo

echo.
echo 🚨 SI SIGUE FALLANDO:
echo • Revisa que los secrets estén bien configurados
echo • Verifica que NETLIFY_AUTH_TOKEN sea válido
echo • Confirma que NETLIFY_SITE_ID sea correcto
echo • Ejecuta: scripts\fix-github-actions.bat para más ayuda

echo.
echo 💡 MIENTRAS ESPERAS:
echo Puedes generar tu APK final:
echo generar-apk-final.bat

echo.
echo 🎯 PRÓXIMO PASO:
echo Espera 5-7 minutos y luego visita www.rentaflux.com

echo.
pause