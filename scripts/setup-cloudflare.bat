@echo off
echo 🌐 Configurando RentaFlux con Cloudflare Tunnel
echo.

echo 📋 Pasos para configurar Cloudflare:
echo.
echo 1. CONFIGURAR DOMINIO EN CLOUDFLARE:
echo    - Ve a https://dash.cloudflare.com/
echo    - Agrega tu dominio rentaflux.com
echo    - Cambia los nameservers en tu proveedor de dominio
echo.
echo 2. INSTALAR CLOUDFLARED:
echo    - Descarga desde: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
echo    - O usa el instalador automático de Windows
echo.
echo 3. CREAR TÚNEL:
echo    - Ejecuta: cloudflared tunnel login
echo    - Ejecuta: cloudflared tunnel create rentaflux
echo    - Configura el túnel para apuntar a localhost:8080
echo.

echo ¿Ya tienes cloudflared instalado?
set /p installed="(s/n): "

if /i "%installed%"=="n" (
    echo.
    echo 📦 Descargando cloudflared...
    echo.
    echo Ve a: https://github.com/cloudflare/cloudflared/releases/latest
    echo Descarga: cloudflared-windows-amd64.exe
    echo Renómbralo a: cloudflared.exe
    echo Ponlo en una carpeta en tu PATH o en la carpeta del proyecto
    echo.
    echo Después ejecuta este script de nuevo.
    pause
    exit /b 1
)

echo.
echo 🔍 Verificando que el servidor esté corriendo...
netstat -ano | findstr :8081 >nul
if %errorlevel% neq 0 (
    echo ⚠️ El servidor de desarrollo no está corriendo en puerto 8081
    echo.
    echo Por favor, abre otra terminal y ejecuta:
    echo npm run dev
    echo.
    echo Luego ejecuta este script de nuevo.
    pause
    exit /b 1
)

echo ✅ Servidor corriendo en puerto 8081
echo.

echo 🚀 Iniciando túnel de Cloudflare...
echo.
echo 📝 Instrucciones:
echo 1. Se abrirá tu navegador para autenticarte con Cloudflare
echo 2. Autoriza el acceso a tu cuenta
echo 3. El túnel se creará automáticamente
echo 4. Copia la URL que aparezca (rentaflux.com)
echo 5. ¡Comparte esa URL con tus amigos!
echo.

echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo 🌐 Creando túnel público...
cloudflared tunnel --url http://localhost:8081 --name rentaflux