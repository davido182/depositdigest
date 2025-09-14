@echo off
setlocal enabledelayedexpansion

REM Script de build para aplicaciones móviles de RentaFlux (Windows)
REM Uso: scripts\build-mobile.bat [android|ios|both] [staging|production]

set PLATFORM=%1
set ENVIRONMENT=%2

if "%PLATFORM%"=="" set PLATFORM=both
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

echo 🚀 Building RentaFlux mobile app...
echo Platform: %PLATFORM%
echo Environment: %ENVIRONMENT%
echo.

REM Validar parámetros
if not "%PLATFORM%"=="android" if not "%PLATFORM%"=="ios" if not "%PLATFORM%"=="both" (
    echo ❌ Error: Platform must be 'android', 'ios', or 'both'
    exit /b 1
)

if not "%ENVIRONMENT%"=="staging" if not "%ENVIRONMENT%"=="production" (
    echo ❌ Error: Environment must be 'staging' or 'production'
    exit /b 1
)

REM Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

REM Verificar npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    exit /b 1
)

REM Verificar Capacitor CLI
call npx cap --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📱 Installing Capacitor CLI...
    call npm install -g @capacitor/cli
)

echo 📦 Installing dependencies...
npm ci
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo 🔍 Running linting...
npm run lint
if %errorlevel% neq 0 (
    echo ⚠️ Linting issues found, but continuing...
)

echo 🔧 Running type checking...
npm run type-check
if %errorlevel% neq 0 (
    echo ⚠️ Type checking issues found, but continuing...
)

REM Build según el entorno
echo 🏗️ Building web application for %ENVIRONMENT%...
if "%ENVIRONMENT%"=="production" (
    npm run build
) else (
    npm run build:staging
)

if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

REM Verificar que el build fue exitoso
if not exist "dist" (
    echo ❌ Error: Build failed - dist directory not found
    exit /b 1
)

echo ✅ Web build completed successfully

REM Sincronizar con Capacitor
echo 🔄 Syncing with Capacitor...
call npx cap sync

REM Agregar plataformas si no existen
if "%PLATFORM%"=="android" goto add_android
if "%PLATFORM%"=="both" goto add_android
goto check_ios

:add_android
if not exist "android" (
    echo 📱 Adding Android platform...
    call npx cap add android
)

:check_ios
if "%PLATFORM%"=="ios" goto add_ios
if "%PLATFORM%"=="both" goto add_ios
goto copy_assets

:add_ios
if not exist "ios" (
    echo 🍎 Adding iOS platform...
    call npx cap add ios
)

:copy_assets
REM Copiar assets específicos de móvil
echo 📋 Copying mobile assets...
if exist "mobile-assets" (
    echo Mobile assets directory found
    REM Aquí se copiarían los assets específicos
)

echo.
echo 🎉 Mobile build completed successfully!
echo.
echo 📱 Next steps:

if "%PLATFORM%"=="android" goto show_android
if "%PLATFORM%"=="both" goto show_android
goto show_ios

:show_android
echo For Android:
echo   1. Open Android Studio: npx cap open android
echo   2. Build APK/AAB for distribution
echo   3. Test on device or emulator

:show_ios
if "%PLATFORM%"=="ios" goto show_ios_steps
if "%PLATFORM%"=="both" goto show_ios_steps
goto show_commands

:show_ios_steps
echo For iOS:
echo   1. Open Xcode: npx cap open ios (Mac only)
echo   2. Configure signing certificates
echo   3. Build for device or simulator

:show_commands
echo.
echo 🔧 Useful commands:
echo   npx cap run android    # Run on Android device
echo   npx cap run ios        # Run on iOS device (Mac only)
echo   npx cap sync           # Sync changes

pause