@echo off
echo 🚀 CONFIGURANDO LIVE UPDATES PARA RENTAFLUX
echo ==========================================

echo.
echo 📋 PASO 1: Verificando Ionic CLI...
call npm list -g @ionic/cli >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ionic CLI no encontrado. Instalando...
    call npm install -g @ionic/cli
    if %errorlevel% neq 0 (
        echo ❌ Error al instalar Ionic CLI
        pause
        exit /b 1
    )
    echo ✅ Ionic CLI instalado correctamente
) else (
    echo ✅ Ionic CLI ya está instalado
)

echo.
echo 🔐 PASO 2: Autenticación requerida
echo Por favor ejecuta manualmente:
echo ionic login
echo.
echo Después de autenticarte, presiona cualquier tecla para continuar...
pause >nul

echo.
echo 🔗 PASO 3: Vinculando proyecto...
call ionic link --app-id com.rentaflux.app
if %errorlevel% neq 0 (
    echo ❌ Error al vincular proyecto
    echo Asegúrate de haber creado el proyecto en Ionic Cloud
    pause
    exit /b 1
)

echo.
echo 🏗️ PASO 4: Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error al construir aplicación
    pause
    exit /b 1
)

echo.
echo 🚀 PASO 5: Desplegando primera actualización...
call ionic deploy build --app-id com.rentaflux.app --channel production
if %errorlevel% neq 0 (
    echo ❌ Error al desplegar actualización
    pause
    exit /b 1
)

echo.
echo ✅ LIVE UPDATES CONFIGURADO CORRECTAMENTE!
echo ==========================================
echo.
echo 📱 Próximos pasos:
echo 1. Genera tu APK: npm run build:mobile
echo 2. Instala el APK en tu dispositivo
echo 3. Para futuras actualizaciones usa: scripts\deploy-live-update.bat
echo.
pause