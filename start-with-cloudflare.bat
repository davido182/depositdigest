@echo off
title RentaFlux - Cloudflare Setup
color 0A

echo.
echo  ██████╗ ███████╗███╗   ██╗████████╗ █████╗ ███████╗██╗     ██╗   ██╗██╗  ██╗
echo  ██╔══██╗██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██╔════╝██║     ██║   ██║╚██╗██╔╝
echo  ██████╔╝█████╗  ██╔██╗ ██║   ██║   ███████║█████╗  ██║     ██║   ██║ ╚███╔╝ 
echo  ██╔══██╗██╔══╝  ██║╚██╗██║   ██║   ██╔══██║██╔══╝  ██║     ██║   ██║ ██╔██╗ 
echo  ██║  ██║███████╗██║ ╚████║   ██║   ██║  ██║██║     ███████╗╚██████╔╝██╔╝ ██╗
echo  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝
echo.
echo                        🌐 Configuración con Cloudflare
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

REM Verificar cloudflared
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ cloudflared no está instalado
    echo.
    echo 📦 Opciones de instalación:
    echo 1. Descarga manual: https://github.com/cloudflare/cloudflared/releases/latest
    echo 2. Con winget: winget install --id Cloudflare.cloudflared
    echo 3. Con chocolatey: choco install cloudflared
    echo.
    echo Después de instalar, ejecuta este script de nuevo.
    pause
    exit /b 1
)
echo ✅ cloudflared encontrado

echo.
echo 📋 ¿Qué tipo de configuración quieres?
echo.
echo 1. Túnel rápido (temporal) - Para pruebas inmediatas
echo 2. Túnel permanente - Para uso continuo
echo 3. Solo iniciar servidor local
echo.

set /p option="Elige una opción (1-3): "

if "%option%"=="1" goto quick_tunnel
if "%option%"=="2" goto permanent_tunnel
if "%option%"=="3" goto local_only
goto invalid_option

:quick_tunnel
echo.
echo 🚀 Configurando túnel rápido...
echo.
echo 📝 Instrucciones:
echo 1. Se iniciará el servidor de desarrollo
echo 2. Se creará un túnel temporal a tu aplicación
echo 3. Recibirás una URL pública para compartir
echo 4. La URL cambiará cada vez que reinicies el túnel
echo.

echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo 🏗️ Iniciando servidor de desarrollo...
start "RentaFlux Dev Server" cmd /k "title RentaFlux Server && npm run dev"

echo ⏳ Esperando que el servidor inicie...
timeout /t 10 /nobreak >nul

echo.
echo 🌐 Creando túnel público...
echo.
echo 💡 Tip: La URL que aparezca es la que debes compartir con tus amigos
echo.
cloudflared tunnel --url http://localhost:8081

goto end

:permanent_tunnel
echo.
echo 🏗️ Configurando túnel permanente...
echo.
echo 📝 Este proceso requiere:
echo 1. Autenticación con tu cuenta de Cloudflare
echo 2. Configuración de DNS para rentaflux.com
echo 3. Creación de túnel nombrado
echo.

echo ¿Ya tienes tu dominio configurado en Cloudflare?
set /p domain_ready="(s/n): "

if /i "%domain_ready%"=="n" (
    echo.
    echo 📋 Primero configura tu dominio:
    echo 1. Ve a https://dash.cloudflare.com/
    echo 2. Agrega rentaflux.com
    echo 3. Cambia los nameservers en tu proveedor de dominio
    echo 4. Espera la propagación (hasta 24 horas)
    echo.
    echo Ejecuta este script de nuevo cuando esté listo.
    pause
    exit /b 1
)

echo.
echo 🔐 Autenticando con Cloudflare...
cloudflared tunnel login

if %errorlevel% neq 0 (
    echo ❌ Error en la autenticación
    pause
    exit /b 1
)

echo.
echo 🚇 Creando túnel 'rentaflux'...
cloudflared tunnel create rentaflux

echo.
echo 🌐 Configurando DNS...
cloudflared tunnel route dns rentaflux rentaflux.com

echo.
echo 🏗️ Iniciando servidor de desarrollo...
start "RentaFlux Dev Server" cmd /k "title RentaFlux Server && npm run dev"

echo ⏳ Esperando que el servidor inicie...
timeout /t 10 /nobreak >nul

echo.
echo 🚇 Iniciando túnel permanente...
echo.
echo ✅ Tu aplicación estará disponible en: https://rentaflux.com
echo.
cloudflared tunnel --config config.yml run rentaflux

goto end

:local_only
echo.
echo 🏠 Iniciando solo servidor local...
echo.
echo 📝 Tu aplicación estará disponible en:
echo 🌐 http://localhost:8081
echo.
npm run dev

goto end

:invalid_option
echo ❌ Opción no válida
pause
exit /b 1

:end
echo.
echo 🎉 ¡Configuración completada!
echo.
echo 📱 Comparte la URL con tus amigos para que prueben RentaFlux
echo.
echo 🔧 Comandos útiles:
echo   npm run dev                    - Servidor de desarrollo
echo   cloudflared tunnel list        - Ver túneles creados
echo   cloudflared tunnel info        - Info del túnel
echo.
pause