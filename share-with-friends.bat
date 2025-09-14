@echo off
title RentaFlux - Compartir con Amigos
color 0B

echo.
echo 🎉 ¡Comparte RentaFlux con tus Amigos!
echo.

echo 🔍 Verificando que todo esté listo...

REM Verificar que el servidor esté corriendo
netstat -ano | findstr :8081 >nul
if %errorlevel% neq 0 (
    echo ⚠️ El servidor no está corriendo en puerto 8081
    echo.
    echo 🚀 Iniciando servidor automáticamente...
    start "RentaFlux Server" cmd /k "npm run dev"
    echo ⏳ Esperando que inicie...
    timeout /t 15 /nobreak >nul
)

echo ✅ Servidor corriendo en puerto 8081

REM Verificar cloudflared
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ cloudflared no está instalado
    echo.
    echo 📦 Instalación rápida:
    echo 1. Ve a: https://github.com/cloudflare/cloudflared/releases/latest
    echo 2. Descarga: cloudflared-windows-amd64.exe
    echo 3. Renómbralo a: cloudflared.exe
    echo 4. Ponlo en la carpeta del proyecto
    echo.
    pause
    exit /b 1
)

echo ✅ cloudflared encontrado

echo.
echo 🌐 Creando túnel público para compartir...
echo.
echo 📋 Información para tus amigos:
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │                    🎉 ¡Prueba RentaFlux!                   │
echo │                                                             │
echo │ 🌐 URL: [Se mostrará abajo]                                │
echo │                                                             │
echo │ 📱 Funciona en:                                            │
echo │ ✅ Computadoras (Chrome, Firefox, Safari, Edge)           │
echo │ ✅ Teléfonos móviles (iOS, Android)                       │
echo │ ✅ Tablets                                                 │
echo │                                                             │
echo │ 🔧 Características para probar:                           │
echo │ • Página de inicio (Landing)                               │
echo │ • Registro de usuario                                      │
echo │ • Gestión de propiedades                                   │
echo │ • Sistema de inquilinos                                    │
echo │ • Panel de pagos                                           │
echo │ • Reportes y analytics                                     │
echo │                                                             │
echo │ 💡 Nota: Esta es una versión de desarrollo                │
echo │ Los cambios se reflejan en tiempo real.                   │
echo └─────────────────────────────────────────────────────────────┘
echo.

echo 🚀 Iniciando túnel...
echo.
echo 💡 IMPORTANTE: Copia la URL https://xxxxx.trycloudflare.com que aparezca
echo    Esa es la URL que debes compartir con tus amigos.
echo.

cloudflared tunnel --url http://localhost:8081