@echo off
echo 🚀 DESPLEGANDO LIVE UPDATE MANUAL
echo =================================

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
echo ✅ ACTUALIZACIÓN PREPARADA!
echo ==========================
echo.
echo 📋 Próximos pasos:
echo 1. Abre Android Studio: npx cap open android
echo 2. Genera nuevo APK con la actualización
echo 3. Los Live Updates funcionarán automáticamente en la app
echo.
echo 💡 Nota: Con Capacitor 6.x, los Live Updates se manejan automáticamente
echo    cuando la app detecta cambios en el servidor.
echo.
pause