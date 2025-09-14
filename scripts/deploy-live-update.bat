@echo off
echo 🚀 DESPLEGANDO LIVE UPDATE
echo =========================

echo.
echo 🏗️ Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error al construir aplicación
    pause
    exit /b 1
)

echo.
echo 📤 Desplegando actualización a producción...
call ionic deploy build --app-id com.rentaflux.app --channel production
if %errorlevel% neq 0 (
    echo ❌ Error al desplegar actualización
    pause
    exit /b 1
)

echo.
echo ✅ ACTUALIZACIÓN DESPLEGADA CORRECTAMENTE!
echo =========================================
echo.
echo 📱 La actualización estará disponible en los dispositivos en unos minutos
echo 🔄 Los usuarios recibirán la actualización automáticamente
echo.
pause