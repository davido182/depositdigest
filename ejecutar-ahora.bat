@echo off
echo ========================================
echo 🚀 RENTAFLUX - CONFIGURACION COMPLETA
echo ========================================
echo.

echo 📋 Paso 1: Verificando dependencias...
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo.
echo 📋 Paso 2: Configurando variables de entorno...
if not exist .env.local (
    copy .env.example .env.local
    echo ⚠️  IMPORTANTE: Edita .env.local con tus credenciales reales
    echo    - STRIPE_PUBLISHABLE_KEY
    echo    - STRIPE_SECRET_KEY
    echo    - CLOUDFLARE_TUNNEL_TOKEN
    pause
)

echo.
echo 📋 Paso 3: Construyendo aplicación...
call npm run build
if errorlevel 1 (
    echo ❌ Error en build
    pause
    exit /b 1
)

echo.
echo 📋 Paso 4: Iniciando servidor local...
start "RentaFlux Local" cmd /k "npm run dev"
timeout /t 3

echo.
echo 📋 Paso 5: Configurando túnel Cloudflare...
call scripts\setup-cloudflare.bat

echo.
echo ========================================
echo ✅ CONFIGURACION COMPLETADA
echo ========================================
echo.
echo 🌐 Tu aplicación está disponible en:
echo    - Local: http://localhost:8081
echo    - Público: https://rentaflux.tu-dominio.com
echo.
echo 📱 Para generar APK móvil:
echo    - Ejecuta: build-mobile.bat
echo.
echo 👥 Para invitar usuarios:
echo    - Lee: docs\como-invitar-usuarios.md
echo.
echo ⚠️  RECUERDA: Tu PC debe estar encendida para que funcione
echo.
pause