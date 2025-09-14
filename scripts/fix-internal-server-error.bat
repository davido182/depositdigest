@echo off
echo 🔧 SOLUCIONANDO INTERNAL SERVER ERROR
echo ====================================

echo.
echo 🎯 PROBLEMA: www.rentaflux.com muestra "internal server error"
echo 🎯 CAUSA: Build colgado o configuración incorrecta

echo.
echo 📋 PASOS PARA SOLUCIONARLO:

echo.
echo 1. ENCONTRAR EL SITIO CORRECTO:
echo    • Ve a: https://app.netlify.com/
echo    • Busca el sitio conectado a "depositdigest" (NO al CV)
echo    • Debería tener www.rentaflux.com como dominio

echo.
echo 2. LIMPIAR DEPLOYS PROBLEMÁTICOS:
echo    • Clic en el sitio correcto
echo    • Ve a "Deploys"
echo    • Si hay un deploy "In progress" o "Failed", cancélalo
echo    • Borra deploys fallidos si es necesario

echo.
echo 3. HACER DEPLOY LIMPIO:
echo    • "Trigger deploy" → "Deploy site"
echo    • O mejor: "Trigger deploy" → "Clear cache and deploy site"

echo.
echo 4. VERIFICAR CONFIGURACIÓN:
echo    • Site settings → Build ^& deploy
echo    • Build command: npm ci ^&^& npm run build
echo    • Publish directory: dist
echo    • Base directory: (vacío)

echo.
echo 5. VARIABLES DE ENTORNO:
echo    • Site settings → Environment variables
echo    • NODE_VERSION = 18
echo    • NPM_VERSION = 8

echo.
echo ✅ RESULTADO ESPERADO:
echo • Deploy exitoso en 2-5 minutos
echo • www.rentaflux.com muestra tu Landing
echo • Sin más "internal server error"

echo.
echo 🚨 SI PERSISTE EL ERROR:
echo • Revisa los logs del deploy para ver el error específico
echo • Puede ser necesario crear un sitio completamente nuevo

echo.
pause