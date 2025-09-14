@echo off
echo ========================================
echo 📱 PROBAR RENTAFLUX EN TU MÓVIL
echo ========================================
echo.

echo Tienes 3 opciones fáciles:
echo.
echo 1️⃣  OPCIÓN MÁS FÁCIL - Navegador móvil
echo    - Inicia el servidor local
echo    - Conecta tu móvil a la misma WiFi
echo    - Abre en el navegador de tu móvil
echo.
echo 2️⃣  OPCIÓN PWA - Instalar como app
echo    - Igual que opción 1
echo    - Pero puedes "instalar" desde el navegador
echo.
echo 3️⃣  OPCIÓN APK - App nativa Android
echo    - Genera APK
echo    - Instala en tu Android
echo.

set /p choice="¿Qué opción prefieres? (1/2/3): "

if "%choice%"=="1" goto opcion1
if "%choice%"=="2" goto opcion2  
if "%choice%"=="3" goto opcion3
echo Opción no válida
pause
exit

:opcion1
echo.
echo 🌐 OPCIÓN 1: Navegador móvil
echo ========================================
echo.
echo Paso 1: Iniciando servidor local...
start "RentaFlux Server" cmd /k "npm run dev"
echo.
echo Paso 2: Obteniendo tu IP local...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    echo Tu IP local es: !ip!
    echo.
    echo 📱 En tu móvil:
    echo    1. Conecta a la misma WiFi
    echo    2. Abre el navegador
    echo    3. Ve a: http://!ip!:8081
    echo.
    goto end1
)
:end1
echo ⚠️  IMPORTANTE: Tu móvil debe estar en la misma red WiFi
pause
exit

:opcion2
echo.
echo 📲 OPCIÓN 2: PWA (Progressive Web App)
echo ========================================
echo.
echo Paso 1: Iniciando servidor local...
start "RentaFlux Server" cmd /k "npm run dev"
echo.
echo Paso 2: Obteniendo tu IP local...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set ip=%%a
    set ip=!ip: =!
    echo Tu IP local es: !ip!
    echo.
    echo 📱 En tu móvil:
    echo    1. Conecta a la misma WiFi
    echo    2. Abre Chrome/Safari
    echo    3. Ve a: http://!ip!:8081
    echo    4. Toca el menú (3 puntos)
    echo    5. Selecciona "Añadir a pantalla de inicio"
    echo    6. ¡Ya tienes la app instalada!
    echo.
    goto end2
)
:end2
echo ✨ La PWA se comporta como una app nativa
pause
exit

:opcion3
echo.
echo 📦 OPCIÓN 3: APK para Android
echo ========================================
echo.
echo Paso 1: Instalando dependencias...
call npm install
echo.
echo Paso 2: Construyendo aplicación web...
call npm run build
echo.
echo Paso 3: Configurando Capacitor...
call npx cap add android 2>nul
call npx cap sync
echo.
echo Paso 4: Generando APK...
echo ⚠️  Esto abrirá Android Studio
echo    1. Espera a que cargue el proyecto
echo    2. Ve a Build > Build Bundle(s) / APK(s) > Build APK(s)
echo    3. Espera a que termine
echo    4. El APK estará en: android\app\build\outputs\apk\debug\
echo.
call npx cap open android
echo.
echo 📱 Para instalar en tu móvil:
echo    1. Transfiere el APK a tu móvil
echo    2. Habilita "Fuentes desconocidas" en Configuración
echo    3. Instala el APK
echo.
pause
exit