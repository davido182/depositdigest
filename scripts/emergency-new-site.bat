@echo off
echo 🚨 SOLUCIÓN DE EMERGENCIA - NUEVO SITIO NETLIFY
echo ===============================================

echo.
echo 🎯 PROBLEMA: Post-processing colgado persistente
echo 🎯 SOLUCIÓN: Crear sitio completamente nuevo

echo.
echo 📋 PASOS URGENTES:

echo.
echo 1. Ve a: https://app.netlify.com/
echo 2. "New site from Git" (botón verde)
echo 3. GitHub → depositdigest
echo 4. Configuración:
echo    • Branch: main
echo    • Build command: (vacío - usará netlify.toml)
echo    • Publish directory: dist
echo 5. "Deploy site"

echo.
echo 6. DESPUÉS DEL PRIMER DEPLOY EXITOSO:
echo    • Site settings → Domain management
echo    • Add custom domain: www.rentaflux.com
echo    • Configurar DNS

echo.
echo ✅ VENTAJAS:
echo • Sitio limpio sin problemas de cache
echo • Sin post-processing colgado
echo • Configuración fresca
echo • Control total

echo.
echo ⏱️ TIEMPO: 5-10 minutos para tener todo funcionando
echo.
pause