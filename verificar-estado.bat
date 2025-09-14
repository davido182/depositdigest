@echo off
echo ========================================
echo 🔍 VERIFICAR ESTADO DE DISTRIBUCIÓN
echo ========================================
echo.

echo 📋 Verificando archivos necesarios...
echo.

REM Verificar build web
if exist "dist" (
    echo ✅ Build web: Completado
) else (
    echo ❌ Build web: Falta - Ejecuta: npm run build
)

REM Verificar configuración Android
if exist "android" (
    echo ✅ Android: Configurado
    if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
        echo ✅ APK: Generado y listo para distribución
        for %%I in ("android\app\build\outputs\apk\debug\app-debug.apk") do echo    Tamaño: %%~zI bytes
    ) else (
        echo ⏳ APK: En proceso o pendiente
        echo    Revisa Android Studio para generar el APK
    )
) else (
    echo ❌ Android: No configurado
)

REM Verificar configuración iOS
if exist "ios" (
    echo ✅ iOS: Configurado (requiere Mac para build)
) else (
    echo ⏳ iOS: No configurado (opcional)
)

REM Verificar variables de entorno
if exist ".env.local" (
    echo ✅ Variables de entorno: Configuradas
    findstr /C:"VITE_STRIPE_PUBLISHABLE_KEY" .env.local >nul
    if errorlevel 1 (
        echo ⚠️  Stripe: Falta configurar
    ) else (
        echo ✅ Stripe: Configurado
    )
    
    findstr /C:"CLOUDFLARE_TUNNEL_TOKEN" .env.local >nul
    if errorlevel 1 (
        echo ⚠️  Cloudflare: Falta configurar
    ) else (
        echo ✅ Cloudflare: Configurado
    )
) else (
    echo ❌ Variables de entorno: Falta .env.local
)

echo.
echo 🌐 Estado de servicios:
echo.

REM Verificar si el servidor local está corriendo
netstat -an | findstr ":8081" >nul
if errorlevel 1 (
    echo ❌ Servidor local: No activo (puerto 8081)
) else (
    echo ✅ Servidor local: Activo en puerto 8081
)

REM Verificar proceso de Cloudflare
tasklist | findstr "cloudflared" >nul
if errorlevel 1 (
    echo ❌ Cloudflare Tunnel: No activo
) else (
    echo ✅ Cloudflare Tunnel: Activo
)

echo.
echo 📤 Estado de distribución:
echo.

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo ✅ APK Android: Listo para compartir
    echo    📍 Ubicación: android\app\build\outputs\apk\debug\app-debug.apk
    echo    📤 Sube a Google Drive, Dropbox, o tu servidor
) else (
    echo ⏳ APK Android: Pendiente
    echo    🔧 Abre Android Studio y genera el APK
)

findstr /C:"CLOUDFLARE_TUNNEL_TOKEN" .env.local >nul 2>&1
if not errorlevel 1 (
    tasklist | findstr "cloudflared" >nul
    if not errorlevel 1 (
        echo ✅ PWA Global: Activo y accesible mundialmente
        echo    🌐 URL: https://rentaflux.tu-dominio.com
    ) else (
        echo ⏳ PWA Global: Configurado pero túnel inactivo
        echo    🚀 Ejecuta: start-with-cloudflare.bat
    )
) else (
    echo ⏳ PWA Global: Pendiente configuración Cloudflare
    echo    📖 Lee: docs\cloudflare-setup.md
)

echo.
echo 🎯 Resumen de acciones pendientes:
echo.

set pending=0

if not exist "dist" (
    echo ❗ Ejecutar: npm run build
    set /a pending+=1
)

if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo ❗ Generar APK en Android Studio
    set /a pending+=1
)

findstr /C:"CLOUDFLARE_TUNNEL_TOKEN" .env.local >nul 2>&1
if errorlevel 1 (
    echo ❗ Configurar Cloudflare en .env.local
    set /a pending+=1
)

tasklist | findstr "cloudflared" >nul
if errorlevel 1 (
    findstr /C:"CLOUDFLARE_TUNNEL_TOKEN" .env.local >nul 2>&1
    if not errorlevel 1 (
        echo ❗ Iniciar túnel Cloudflare
        set /a pending+=1
    )
)

if %pending%==0 (
    echo ✅ ¡Todo listo para distribución!
    echo.
    echo 📱 APK: Comparte el archivo generado
    echo 🌐 PWA: Comparte tu URL de Cloudflare
    echo.
    echo 💬 Usa el mensaje en: enlaces-distribucion.md
) else (
    echo ⏳ %pending% acciones pendientes
)

echo.
pause