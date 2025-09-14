@echo off
echo 📱 Configuración completa de aplicaciones móviles RentaFlux
echo.

echo 🔍 Verificando prerrequisitos...

REM Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

REM Verificar npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm no está disponible
    pause
    exit /b 1
)
echo ✅ npm encontrado

echo.
echo 📦 Instalando dependencias...
npm install --legacy-peer-deps

echo.
echo 🏗️ Construyendo aplicación web...
npm run build

echo.
echo 📱 Instalando Capacitor CLI globalmente...
npm install -g @capacitor/cli

echo.
echo 🔄 Sincronizando con Capacitor...
npx cap sync

echo.
echo 📋 ¿Qué plataforma quieres configurar?
echo 1. Android
echo 2. iOS (solo Mac)
echo 3. Ambas
echo.

set /p platform="Elige una opción (1-3): "

if "%platform%"=="1" goto setup_android
if "%platform%"=="2" goto setup_ios
if "%platform%"=="3" goto setup_both
goto invalid_option

:setup_android
echo.
echo 🤖 Configurando Android...
npx cap add android
echo.
echo ✅ Android configurado
echo.
echo 📋 Próximos pasos para Android:
echo 1. Instala Android Studio desde: https://developer.android.com/studio
echo 2. Ejecuta: npx cap open android
echo 3. Configura un dispositivo virtual o conecta uno físico
echo 4. Presiona el botón Run en Android Studio
echo.
goto end

:setup_ios
echo.
echo 🍎 Configurando iOS...
npx cap add ios
echo.
echo ✅ iOS configurado
echo.
echo 📋 Próximos pasos para iOS:
echo 1. Asegúrate de estar en Mac con Xcode instalado
echo 2. Ejecuta: npx cap open ios
echo 3. Configura tu Apple Developer account
echo 4. Selecciona un dispositivo o simulador
echo 5. Presiona el botón Run en Xcode
echo.
goto end

:setup_both
echo.
echo 🤖🍎 Configurando Android e iOS...
npx cap add android
npx cap add ios
echo.
echo ✅ Ambas plataformas configuradas
echo.
echo 📋 Próximos pasos:
echo.
echo Para Android:
echo 1. Instala Android Studio
echo 2. Ejecuta: npx cap open android
echo.
echo Para iOS:
echo 1. En Mac, abre Xcode
echo 2. Ejecuta: npx cap open ios
echo.
goto end

:invalid_option
echo ❌ Opción no válida
pause
exit /b 1

:end
echo.
echo 🎉 ¡Configuración móvil completada!
echo.
echo 🔧 Comandos útiles:
echo   npm run mobile:build          - Build completo para móvil
echo   npx cap run android          - Ejecutar en Android
echo   npx cap run ios              - Ejecutar en iOS
echo   npx cap open android         - Abrir Android Studio
echo   npx cap open ios             - Abrir Xcode
echo   npx cap sync                 - Sincronizar cambios
echo.
echo 📖 Consulta docs/mobile-deployment-complete.md para más detalles
echo.
pause