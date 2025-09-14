@echo off
echo 🌐 Configurando túnel para desarrollo de RentaFlux...
echo.

REM Verificar si ngrok está instalado
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 ngrok no está instalado. Instalando...
    echo.
    echo Opciones de instalación:
    echo 1. Descargar desde: https://ngrok.com/download
    echo 2. O usar chocolatey: choco install ngrok
    echo 3. O usar scoop: scoop install ngrok
    echo.
    echo Después de instalar, ejecuta este script de nuevo.
    pause
    exit /b 1
)

echo ✅ ngrok encontrado
echo.

REM Verificar si el servidor está corriendo
netstat -ano | findstr :8080 >nul
if %errorlevel% neq 0 (
    echo ⚠️ El servidor de desarrollo no está corriendo en el puerto 8080
    echo Por favor, ejecuta 'npm run dev' en otra terminal primero.
    echo.
    pause
    exit /b 1
)

echo 🚀 Creando túnel público para localhost:8080...
echo.
echo 📝 Instrucciones:
echo 1. Se abrirá un túnel público a tu aplicación local
echo 2. Copia la URL https://xxxxx.ngrok.io que aparezca
echo 3. Configura tu dominio para apuntar a esa URL
echo 4. ¡Ya puedes desarrollar en tiempo real!
echo.

ngrok http 8080