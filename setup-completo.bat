@echo off
echo ========================================
echo DISTRIBUCION COMPLETA RENTAFLUX
echo ========================================
echo.
echo APK Android + PWA Global
echo.
echo Este script configurara:
echo - APK para Android (distribucion mundial)
echo - PWA con Cloudflare (iPhone + Android)
echo - Enlaces para compartir con amigos
echo.

set /p confirm="Continuar con la configuracion completa? (s/n): "
if /i not "%confirm%"=="s" exit

echo.
echo ========================================
echo FASE 1: PREPARACION GENERAL
echo ========================================
echo.

echo Instalando dependencias...
call npm install
if errorlevel 1 (
    echo Error instalando dependencias
    pause
    exit /b 1
)

echo.
echo Verificando configuracion...
if not exist .env.local (
    echo Creando archivo de configuracion...
    copy .env.example .env.local
    echo.
    echo IMPORTANTE: Edita .env.local con tus credenciales:
    echo    - VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
    echo    - STRIPE_SECRET_KEY=sk_test_...
    echo    - CLOUDFLARE_TUNNEL_TOKEN=tu_token
    echo.
    echo Presiona cualquier tecla despues de editar .env.local
    pause
)

echo.
echo Construyendo aplicacion web...
call npm run build
if errorlevel 1 (
    echo Error en build web
    pause
    exit /b 1
)

echo.
echo ========================================
echo FASE 2: APK ANDROID
echo ========================================
echo.

echo Configurando Capacitor para Android...
call npx cap add android 2>nul
call npx cap sync
if errorlevel 1 (
    echo Error configurando Capacitor
    pause
    exit /b 1
)

echo.
echo Abriendo Android Studio para generar APK...
echo.
echo INSTRUCCIONES PARA ANDROID STUDIO:
echo    1. Espera a que cargue completamente
echo    2. Ve a: Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo    3. Espera el build (puede tomar 5-10 minutos)
echo    4. Busca el APK en: android\app\build\outputs\apk\debug\
echo.

start "Android Studio" cmd /k "npx cap open android"
echo Android Studio iniciandose en ventana separada...

echo.
echo ========================================
echo FASE 3: PWA GLOBAL CON CLOUDFLARE
echo ========================================
echo.

echo Configurando tunel Cloudflare...
echo.
echo NECESITAS:
echo    1. Token de Cloudflare Tunnel en .env.local
echo    2. Dominio configurado (rentaflux.com o subdominio)
echo.

set /p has_cloudflare="Ya tienes configurado Cloudflare? (s/n): "
if /i "%has_cloudflare%"=="s" (
    echo Iniciando tunel Cloudflare...
    start "Cloudflare Tunnel" cmd /k "call start-with-cloudflare.bat"
    echo Tunel iniciandose en ventana separada...
) else (
    echo.
    echo Para configurar Cloudflare:
    echo    1. Ve a: https://dash.cloudflare.com
    echo    2. Crea un tunel
    echo    3. Copia el token a .env.local
    echo    4. Ejecuta: start-with-cloudflare.bat
    echo.
    echo Guia completa en: docs\cloudflare-setup.md
)

echo.
echo ========================================
echo PREPARANDO DISTRIBUCION
echo ========================================
echo.

echo Creando instrucciones para compartir...

echo # RentaFlux - Enlaces de Distribucion > enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo ## Para Android: >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo APK Directo: >> enlaces-distribucion.txt
echo - Archivo: android\app\build\outputs\apk\debug\app-debug.apk >> enlaces-distribucion.txt
echo - Sube a Google Drive, Dropbox, o tu servidor >> enlaces-distribucion.txt
echo - Comparte el enlace de descarga >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo Instrucciones para usuarios: >> enlaces-distribucion.txt
echo 1. Descargar el APK >> enlaces-distribucion.txt
echo 2. Habilitar "Fuentes desconocidas" en Configuracion >> enlaces-distribucion.txt
echo 3. Instalar el archivo descargado >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo ## Para iPhone + Android (PWA): >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo Enlace web: https://rentaflux.tu-dominio.com >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo Instrucciones para usuarios: >> enlaces-distribucion.txt
echo 1. Abrir el enlace en el navegador >> enlaces-distribucion.txt
echo 2. Tocar el menu (3 puntos o compartir) >> enlaces-distribucion.txt
echo 3. Seleccionar "Anadir a pantalla de inicio" >> enlaces-distribucion.txt
echo 4. La app se instala como nativa! >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo ## Mensaje para compartir: >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo Prueba mi nueva app RentaFlux! >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo Android: [enlace-a-tu-apk] >> enlaces-distribucion.txt
echo iPhone/Web: https://rentaflux.tu-dominio.com >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo Gestion de propiedades moderna y facil >> enlaces-distribucion.txt
echo Funciona offline una vez instalada >> enlaces-distribucion.txt
echo. >> enlaces-distribucion.txt
echo Dejame saber que opinas! >> enlaces-distribucion.txt

echo.
echo ========================================
echo CONFIGURACION COMPLETADA
echo ========================================
echo.
echo Estado actual:
echo.
echo Android Studio: Abierto (generando APK)
if /i "%has_cloudflare%"=="s" (
    echo Cloudflare Tunnel: Activo
) else (
    echo Cloudflare Tunnel: Pendiente configuracion
)
echo Instrucciones: enlaces-distribucion.txt creado
echo.
echo Proximos pasos:
echo.
echo 1. Espera a que termine el APK en Android Studio
echo 2. Sube el APK a Google Drive/Dropbox
echo 3. Configura Cloudflare si no lo has hecho
echo 4. Comparte los enlaces con tus amigos
echo.
echo Documentacion completa:
echo    - docs\distribucion-global.md
echo    - docs\cloudflare-setup.md
echo    - enlaces-distribucion.txt
echo.
echo IMPORTANTE: 
echo    - Para APK: El archivo estara en android\app\build\outputs\apk\debug\
echo    - Para PWA: Tu PC debe estar encendida con el tunel activo
echo.

pause
echo.
echo Quieres abrir la documentacion de distribucion?
set /p open_docs="(s/n): "
if /i "%open_docs%"=="s" (
    start notepad enlaces-distribucion.txt
    start notepad docs\distribucion-global.md
)

echo.
echo Distribucion completa configurada!
echo    Revisa las ventanas abiertas para continuar.
pause