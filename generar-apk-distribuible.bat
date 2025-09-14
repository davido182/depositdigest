@echo off
echo ========================================
echo 📦 GENERAR APK PARA DISTRIBUCIÓN GLOBAL
echo ========================================
echo.
echo ✨ Este APK funcionará en cualquier Android del mundo
echo    (No necesita WiFi local, se puede compartir por internet)
echo.

echo 📋 Paso 1: Preparando entorno...
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo.
echo 🏗️ Paso 2: Construyendo aplicación web...
call npm run build
if errorlevel 1 (
    echo ❌ Error en build
    pause
    exit /b 1
)

echo.
echo 📱 Paso 3: Configurando Capacitor para Android...
call npx cap add android 2>nul
call npx cap sync
if errorlevel 1 (
    echo ❌ Error configurando Capacitor
    pause
    exit /b 1
)

echo.
echo 🔧 Paso 4: Configurando para distribución...
echo Actualizando configuración de Android...

REM Crear archivo de configuración para release
echo android { > android\app\build.gradle.tmp
echo     compileSdkVersion 34 >> android\app\build.gradle.tmp
echo     buildToolsVersion "34.0.0" >> android\app\build.gradle.tmp
echo     defaultConfig { >> android\app\build.gradle.tmp
echo         applicationId "com.rentaflux.app" >> android\app\build.gradle.tmp
echo         minSdkVersion 22 >> android\app\build.gradle.tmp
echo         targetSdkVersion 34 >> android\app\build.gradle.tmp
echo         versionCode 1 >> android\app\build.gradle.tmp
echo         versionName "1.0.0" >> android\app\build.gradle.tmp
echo     } >> android\app\build.gradle.tmp
echo     buildTypes { >> android\app\build.gradle.tmp
echo         debug { >> android\app\build.gradle.tmp
echo             debuggable true >> android\app\build.gradle.tmp
echo         } >> android\app\build.gradle.tmp
echo         release { >> android\app\build.gradle.tmp
echo             minifyEnabled false >> android\app\build.gradle.tmp
echo             proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro' >> android\app\build.gradle.tmp
echo         } >> android\app\build.gradle.tmp
echo     } >> android\app\build.gradle.tmp
echo } >> android\app\build.gradle.tmp

echo.
echo 🚀 Paso 5: Abriendo Android Studio...
echo.
echo ⚠️  INSTRUCCIONES IMPORTANTES:
echo.
echo 1️⃣  Android Studio se abrirá automáticamente
echo 2️⃣  Espera a que termine de cargar (puede tomar varios minutos)
echo 3️⃣  Ve al menú: Build > Build Bundle(s) / APK(s) > Build APK(s)
echo 4️⃣  Espera a que termine el build
echo 5️⃣  Aparecerá un popup con "APK(s) generated successfully"
echo 6️⃣  Haz clic en "locate" para encontrar el APK
echo.
echo 📍 El APK estará en:
echo    android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 📤 Para compartir con amigos:
echo    1. Sube el APK a Google Drive, Dropbox, etc.
echo    2. Comparte el enlace de descarga
echo    3. Tus amigos pueden instalarlo desde cualquier lugar
echo.

pause
echo Abriendo Android Studio...
call npx cap open android

echo.
echo ========================================
echo 📱 DESPUÉS DEL BUILD EN ANDROID STUDIO
echo ========================================
echo.
echo Una vez que tengas el APK:
echo.
echo 📤 OPCIÓN 1: Google Drive
echo    1. Sube app-debug.apk a Google Drive
echo    2. Comparte enlace público
echo    3. Tus amigos descargan e instalan
echo.
echo 📤 OPCIÓN 2: Servidor web
echo    1. Sube el APK a tu servidor/hosting
echo    2. Comparte la URL directa
echo    3. Descarga directa desde navegador
echo.
echo 📤 OPCIÓN 3: Telegram/WhatsApp
echo    1. Envía el APK directamente por chat
echo    2. Funciona para archivos menores a 50MB
echo.
echo 📋 Instrucciones para tus amigos:
echo    1. Descargar el APK
echo    2. Ir a Configuración > Seguridad
echo    3. Habilitar "Fuentes desconocidas" o "Instalar apps desconocidas"
echo    4. Abrir el APK descargado
echo    5. Tocar "Instalar"
echo.
echo ✅ ¡La app funcionará completamente offline una vez instalada!
echo.
pause