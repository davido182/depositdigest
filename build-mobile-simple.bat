@echo off
echo ========================================
echo 📱 BUILD MÓVIL SIMPLIFICADO
echo ========================================
echo.

echo 📦 Paso 1: Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo.
echo 🏗️ Paso 2: Construyendo aplicación web...
call npm run build
if errorlevel 1 (
    echo ❌ Error en build web
    pause
    exit /b 1
)

echo.
echo 📱 Paso 3: Configurando Capacitor...
call npx cap add android 2>nul
echo Sincronizando...
call npx cap sync
if errorlevel 1 (
    echo ❌ Error en Capacitor sync
    pause
    exit /b 1
)

echo.
echo ✅ ¡Configuración completada!
echo.
echo 🎯 Opciones disponibles:
echo.
echo 1️⃣  Abrir Android Studio para generar APK:
echo    npx cap open android
echo.
echo 2️⃣  Ejecutar directamente en dispositivo Android:
echo    npx cap run android
echo.
echo 3️⃣  Ver en navegador móvil (más fácil):
echo    Ejecuta: probar-en-movil.bat
echo.

set /p choice="¿Qué quieres hacer? (1/2/3): "

if "%choice%"=="1" (
    echo Abriendo Android Studio...
    call npx cap open android
)
if "%choice%"=="2" (
    echo Ejecutando en dispositivo...
    call npx cap run android
)
if "%choice%"=="3" (
    call probar-en-movil.bat
)

pause