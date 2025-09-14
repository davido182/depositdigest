@echo off
echo 🆕 CREAR SITIO NUEVO EN NETLIFY (SOLUCIÓN DEFINITIVA)
echo ================================================

echo.
echo 🚨 PROBLEMA DETECTADO:
echo • rentaflux.netlify.app apunta a tu CV
echo • Hay confusión entre múltiples sitios
echo • El build se está ejecutando en el sitio equivocado

echo.
echo 🎯 SOLUCIÓN: CREAR SITIO COMPLETAMENTE NUEVO

echo.
echo 📋 PASOS EXACTOS:

echo.
echo 1. Ve a: https://app.netlify.com/
echo 2. Clic "New site from Git" (botón verde grande)
echo 3. Selecciona "GitHub"
echo 4. Busca tu repositorio "depositdigest" (donde está nuestro trabajo)
echo 5. Configuración:
echo    • Branch: main
echo    • Build command: npm ci ^&^& npm run build
echo    • Publish directory: dist
echo    • Base directory: (vacío)

echo.
echo 6. Clic "Deploy site"

echo.
echo 7. DESPUÉS DEL PRIMER DEPLOY EXITOSO:
echo    • Site settings
echo    • Domain management
echo    • Add custom domain: www.rentaflux.com
echo    • Configurar DNS

echo.
echo ✅ RESULTADO:
echo • Tendrás un sitio nuevo y limpio
echo • Conectado al repositorio correcto
echo • Con todas nuestras mejoras
echo • Sin confusiones con otros proyectos

echo.
echo 💡 VENTAJA:
echo • Control total sobre el nuevo sitio
echo • Sin interferencias de configuraciones anteriores
echo • Deploy limpio desde cero

echo.
pause