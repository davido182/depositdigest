@echo off
echo ========================================
echo 📦 GENERANDO APK - RENTAFLUX
echo ========================================
echo.

echo 🔍 Verificando requisitos...

REM Verificar Java
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java no encontrado
    echo.
    echo 📥 NECESITAS INSTALAR JAVA:
    echo    1. Ve a: https://www.oracle.com/java/technologies/downloads/
    echo    2. Descarga Java JDK 17 o superior
    echo    3. Instala y reinicia
    echo    4. Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
)

echo ✅ Java encontrado

REM Verificar estructura Android
if not exist "android" (
    echo ❌ Carpeta Android no encontrada
    echo 🔧 Configurando Capacitor...
    call npx cap add android
    call npx cap sync
)

echo ✅ Estructura Android verificada

echo.
echo 🚀 GENERANDO APK...
echo ⏱️ Esto puede tomar 5-15 minutos la primera vez
echo.

REM Cambiar a directorio android y ejecutar build
pushd android
call gradlew.bat assembleDebug
set build_result=%errorlevel%
popd

if %build_result% neq 0 (
    echo.
    echo ❌ Error en el build automático
    echo.
    echo 🔧 PLAN B: Android Studio
    echo    1. Se abrirá Android Studio
    echo    2. Espera a que cargue completamente
    echo    3. Ve a: Build > Build Bundle(s) / APK(s) > Build APK(s)
    echo    4. Espera el build
    echo.
    pause
    call npx cap open android
    exit /b 1
)

echo.
echo ========================================
echo ✅ ¡APK GENERADO EXITOSAMENTE!
echo ========================================
echo.

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo 📍 Tu APK está en: android\app\build\outputs\apk\debug\app-debug.apk
    
    for %%I in ("android\app\build\outputs\apk\debug\app-debug.apk") do (
        echo 📊 Tamaño: %%~zI bytes (~%%~zI MB)
    )
    
    echo.
    echo 🎉 ¡RENTAFLUX APK LISTO PARA INSTALAR!
    echo.
    echo ========================================
    echo 📱 CÓMO INSTALAR EN TU ANDROID
    echo ========================================
    echo.
    echo 🔄 PASO 1: TRANSFERIR EL APK
    echo    Elige uno de estos métodos:
    echo.
    echo    📁 USB:
    echo       1. Conecta tu Android a la PC
    echo       2. Copia app-debug.apk a tu móvil
    echo       3. Desconecta
    echo.
    echo    📤 WhatsApp:
    echo       1. Abre WhatsApp Web
    echo       2. Envíate el APK a ti mismo
    echo       3. Descárgalo en tu móvil
    echo.
    echo    ☁️ Google Drive:
    echo       1. Sube el APK a Drive
    echo       2. Descárgalo desde tu móvil
    echo.
    echo 🔓 PASO 2: HABILITAR INSTALACIÓN
    echo    En tu Android:
    echo    1. Configuración > Seguridad
    echo    2. "Fuentes desconocidas" > ON
    echo    O:
    echo    1. Configuración > Apps
    echo    2. Acceso especial > Instalar apps desconocidas
    echo    3. Selecciona tu explorador de archivos > Permitir
    echo.
    echo 📲 PASO 3: INSTALAR
    echo    1. Abre el APK en tu móvil
    echo    2. Toca "Instalar"
    echo    3. Espera la instalación
    echo    4. ¡Abre RentaFlux desde tu pantalla de inicio!
    echo.
    
    set /p open_folder="¿Abrir carpeta del APK ahora? (s/n): "
    if /i "%open_folder%"=="s" (
        explorer "android\app\build\outputs\apk\debug\"
    )
    
    echo.
    echo 🚀 DESPUÉS DE INSTALAR:
    echo    ✅ Prueba todas las funciones
    echo    ✅ Toma screenshots si hay problemas
    echo    ✅ ¡Comparte con amigos usando el mismo APK!
    echo.
    
) else (
    echo ❌ APK no encontrado después del build
    echo 🔧 Abriendo Android Studio como respaldo...
    call npx cap open android
)

echo.
echo 🎊 ¡FELICITACIONES!
echo Tu RentaFlux está listo para Android
echo.
pause