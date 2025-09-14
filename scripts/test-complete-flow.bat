@echo off
echo 🧪 PROBANDO FLUJO COMPLETO DE LIVE UPDATES
echo ==========================================

echo.
echo 🏗️ Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error al construir aplicación
    pause
    exit /b 1
)

echo.
echo 🌐 Probando localmente...
echo Iniciando servidor local para probar...
start http://localhost:4173
call npm run preview

echo.
echo ✅ PRUEBAS COMPLETADAS
echo =====================

echo.
echo 📋 Verifica que:
echo • La página principal (/) muestra el Landing
echo • El ChatAssistant rechaza preguntas fuera de contexto
echo • Las sugerencias inteligentes funcionan
echo • La navegación es fluida

echo.
echo 🚀 Si todo funciona bien:
echo 1. Haz commit y push a GitHub
echo 2. GitHub Actions desplegará automáticamente
echo 3. www.rentaflux.com se actualizará
echo 4. Genera tu APK final

echo.
pause