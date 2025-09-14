@echo off
echo 🚀 GENERANDO APK FINAL CON TODAS LAS MEJORAS
echo =============================================

echo.
echo ✅ Backup creado: ../depositdigest_backup_2025-09-14_14-21-01
echo ✅ Live Updates configurado
echo ✅ ChatAssistant mejorado con sugerencias inteligentes
echo ✅ Capacitor estabilizado en versión 6.1.2

echo.
echo 🏗️ Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error al construir aplicación
    pause
    exit /b 1
)

echo.
echo 📱 Sincronizando con Capacitor...
call npx cap sync
if %errorlevel% neq 0 (
    echo ❌ Error al sincronizar Capacitor
    pause
    exit /b 1
)

echo.
echo 🔨 Generando APK...
call npx ionic capacitor build android
if %errorlevel% neq 0 (
    echo ❌ Error al generar APK
    echo 💡 Intenta abrir Android Studio manualmente: npx cap open android
    pause
    exit /b 1
)

echo.
echo ✅ APK GENERADO EXITOSAMENTE!
echo ============================
echo.
echo 📱 Tu APK está en: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 🎯 Características incluidas:
echo • Live Updates automáticos
echo • ChatAssistant con IA mejorada
echo • Sugerencias inteligentes de consulta
echo • Análisis avanzado de rentabilidad
echo • Detección de pagos atrasados
echo • Interfaz optimizada para móvil
echo.
echo 🚀 Próximos pasos:
echo 1. Instala el APK en tu dispositivo
echo 2. Para futuras actualizaciones: scripts\deploy-live-update-manual.bat
echo 3. El ChatAssistant ahora tiene sugerencias categorizadas
echo.
pause