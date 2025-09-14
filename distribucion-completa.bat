@echo off
echo ========================================
echo 🌍 DISTRIBUCIÓN COMPLETA RENTAFLUX
echo ========================================
echo.
echo 📱 APK Android + 🌐 PWA Global
echo.
echo Este script configurará:
echo ✅ APK para Android (distribución mundial)
echo ✅ PWA con Cloudflare (iPhone + Android)
echo ✅ Enlaces para compartir con amigos
echo.

set /p confirm="¿Continuar con la configuración completa? (s/n): "
if /i not "%confirm%"=="s" exit

echo.
echo ========================================
echo 📋 FASE 1: PREPARACIÓN GENERAL
echo ========================================
echo.

echo 📦 Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo.
echo 🔍 Verificando configuración...
if not exist .env.local (
    echo ⚠️  Creando archivo de configuración...
    copy .env.example .env.local
    echo.
    echo 🔧 IMPORTANTE: Edita .env.local con tus credenciales:
    echo    - VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
    echo    - STRIPE_SECRET_KEY=sk_test_...
    echo    - CLOUDFLARE_TUNNEL_TOKEN=tu_token
    echo.
    echo ⏸️  Presiona cualquier tecla después de editar .env.local
    pause
)

echo.
echo 🏗️ Construyendo aplicación web...
call npm run build
if errorlevel 1 (
    echo ❌ Error en build web
    pause
    exit /b 1
)

echo.
echo ========================================
echo 📱 FASE 2: APK ANDROID
echo ========================================
echo.

echo 📱 Configurando Capacitor para Android...
call npx cap add android 2>nul
call npx cap sync
if errorlevel 1 (
    echo ❌ Error configurando Capacitor
    pause
    exit /b 1
)

echo.
echo 🔧 Optimizando configuración de Android...
REM Actualizar capacitor.config.ts para producción
echo import { CapacitorConfig } from '@capacitor/cli'; > capacitor.config.prod.ts
echo. >> capacitor.config.prod.ts
echo const config: CapacitorConfig = { >> capacitor.config.prod.ts
echo   appId: 'com.rentaflux.app', >> capacitor.config.prod.ts
echo   appName: 'RentaFlux', >> capacitor.config.prod.ts
echo   webDir: 'dist', >> capacitor.config.prod.ts
echo   server: { >> capacitor.config.prod.ts
echo     androidScheme: 'https' >> capacitor.config.prod.ts
echo   }, >> capacitor.config.prod.ts
echo   plugins: { >> capacitor.config.prod.ts
echo     SplashScreen: { >> capacitor.config.prod.ts
echo       launchShowDuration: 2000, >> capacitor.config.prod.ts
echo       backgroundColor: '#1a1a1a', >> capacitor.config.prod.ts
echo       showSpinner: false >> capacitor.config.prod.ts
echo     } >> capacitor.config.prod.ts
echo   } >> capacitor.config.prod.ts
echo }; >> capacitor.config.prod.ts
echo. >> capacitor.config.prod.ts
echo export default config; >> capacitor.config.prod.ts

echo ✅ Configuración de Android lista
echo.
echo 🚀 Abriendo Android Studio para generar APK...
echo.
echo ⚠️  INSTRUCCIONES PARA ANDROID STUDIO:
echo    1. Espera a que cargue completamente
echo    2. Ve a: Build > Build Bundle(s) / APK(s) > Build APK(s)
echo    3. Espera el build (puede tomar 5-10 minutos)
echo    4. Busca el APK en: android\app\build\outputs\apk\debug\
echo.

start "Android Studio" cmd /k "npx cap open android"
echo Android Studio iniciándose en ventana separada...

echo.
echo ========================================
echo 🌐 FASE 3: PWA GLOBAL CON CLOUDFLARE
echo ========================================
echo.

echo 🔄 Configurando túnel Cloudflare...
echo.
echo ⚠️  NECESITAS:
echo    1. Token de Cloudflare Tunnel en .env.local
echo    2. Dominio configurado (rentaflux.com o subdominio)
echo.

set /p has_cloudflare="¿Ya tienes configurado Cloudflare? (s/n): "
if /i "%has_cloudflare%"=="s" (
    echo 🚀 Iniciando túnel Cloudflare...
    start "Cloudflare Tunnel" cmd /k "call start-with-cloudflare.bat"
    echo Túnel iniciándose en ventana separada...
) else (
    echo.
    echo 📋 Para configurar Cloudflare:
    echo    1. Ve a: https://dash.cloudflare.com
    echo    2. Crea un túnel
    echo    3. Copia el token a .env.local
    echo    4. Ejecuta: start-with-cloudflare.bat
    echo.
    echo 📖 Guía completa en: docs\cloudflare-setup.md
)

echo.
echo ========================================
echo 📤 FASE 4: PREPARANDO DISTRIBUCIÓN
echo ========================================
echo.

echo 📋 Creando instrucciones para compartir...

REM Crear archivo con enlaces de distribución
echo # 🎉 RentaFlux - Enlaces de Distribución > enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo ## 📱 Para Android: >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo **APK Directo:** >> enlaces-distribucion.md
echo - Archivo: `android\app\build\outputs\apk\debug\app-debug.apk` >> enlaces-distribucion.md
echo - Sube a Google Drive, Dropbox, o tu servidor >> enlaces-distribucion.md
echo - Comparte el enlace de descarga >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo **Instrucciones para usuarios:** >> enlaces-distribucion.md
echo 1. Descargar el APK >> enlaces-distribucion.md
echo 2. Habilitar "Fuentes desconocidas" en Configuración >> enlaces-distribucion.md
echo 3. Instalar el archivo descargado >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo ## 🌐 Para iPhone + Android (PWA): >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo **Enlace web:** https://rentaflux.tu-dominio.com >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo **Instrucciones para usuarios:** >> enlaces-distribucion.md
echo 1. Abrir el enlace en el navegador >> enlaces-distribucion.md
echo 2. Tocar el menú (3 puntos o compartir) >> enlaces-distribucion.md
echo 3. Seleccionar "Añadir a pantalla de inicio" >> enlaces-distribucion.md
echo 4. ¡La app se instala como nativa! >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo ## 💬 Mensaje para compartir: >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo ```text >> enlaces-distribucion.md
echo 🏠 ¡Prueba mi nueva app RentaFlux! >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo 📱 Android: [enlace-a-tu-apk] >> enlaces-distribucion.md
echo 🌐 iPhone/Web: https://rentaflux.tu-dominio.com >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo ✨ Gestión de propiedades moderna y fácil >> enlaces-distribucion.md
echo ⚡ Funciona offline una vez instalada >> enlaces-distribucion.md
echo. >> enlaces-distribucion.md
echo ¡Déjame saber qué opinas! >> enlaces-distribucion.md
echo ``` >> enlaces-distribucion.md

echo.
echo ========================================
echo ✅ CONFIGURACIÓN COMPLETADA
echo ========================================
echo.
echo 🎯 Estado actual:
echo.
echo 📱 Android Studio: Abierto (generando APK)
if /i "%has_cloudflare%"=="s" (
    echo 🌐 Cloudflare Tunnel: Activo
) else (
    echo 🌐 Cloudflare Tunnel: Pendiente configuración
)
echo 📋 Instrucciones: enlaces-distribucion.md creado
echo.
echo 🔄 Próximos pasos:
echo.
echo 1️⃣  Espera a que termine el APK en Android Studio
echo 2️⃣  Sube el APK a Google Drive/Dropbox
echo 3️⃣  Configura Cloudflare si no lo has hecho
echo 4️⃣  Comparte los enlaces con tus amigos
echo.
echo 📖 Documentación completa:
echo    - docs\distribucion-global.md
echo    - docs\cloudflare-setup.md
echo    - enlaces-distribucion.md
echo.
echo ⚠️  IMPORTANTE: 
echo    - Para APK: El archivo estará en android\app\build\outputs\apk\debug\
echo    - Para PWA: Tu PC debe estar encendida con el túnel activo
echo.

pause
echo.
echo 🚀 ¿Quieres abrir la documentación de distribución?
set /p open_docs="(s/n): "
if /i "%open_docs%"=="s" (
    start notepad enlaces-distribucion.md
    start notepad docs\distribucion-global.md
)

echo.
echo ✨ ¡Distribución completa configurada!
echo    Revisa las ventanas abiertas para continuar.
pause