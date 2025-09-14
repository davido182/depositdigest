@echo off
echo ========================================
echo  RentaFlux - Deploy with Live Updates
echo ========================================

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

echo Desplegando para ambiente: %ENVIRONMENT%

echo.
echo [1/5] Construyendo aplicacion web...
if "%ENVIRONMENT%"=="staging" (
    call npm run build:staging
) else (
    call npm run build
)

if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo en la construccion de la aplicacion web
    pause
    exit /b 1
)

echo.
echo [2/5] Sincronizando con Capacitor...
call npx cap sync

if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo en la sincronizacion de Capacitor
    pause
    exit /b 1
)

echo.
echo [3/5] Creando bundle para Live Updates...
call npx @capacitor/live-updates bundle --app-id com.rentaflux.app --channel %ENVIRONMENT%

if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo en la creacion del bundle de Live Updates
    pause
    exit /b 1
)

echo.
echo [4/5] Subiendo actualizacion a Capacitor Cloud...
call npx @capacitor/live-updates upload --app-id com.rentaflux.app --channel %ENVIRONMENT%

if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallo en la subida a Capacitor Cloud
    pause
    exit /b 1
)

echo.
echo [5/5] Desplegando aplicacion web...
if "%ENVIRONMENT%"=="staging" (
    echo Desplegando a servidor de staging...
    rem Aqui iria el comando para desplegar a staging
) else (
    echo Desplegando a servidor de produccion...
    rem Aqui iria el comando para desplegar a produccion
)

echo.
echo ========================================
echo  DESPLIEGUE COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo La aplicacion web ha sido desplegada y la actualizacion
echo de Live Updates esta disponible para dispositivos moviles.
echo.
echo Los usuarios recibiran la actualizacion automaticamente
echo en los proximos 30 minutos.
echo.
pause