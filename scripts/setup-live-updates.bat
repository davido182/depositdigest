@echo off
echo ========================================
echo  RentaFlux - Configurar Live Updates
echo ========================================

echo.
echo [1/4] Instalando Capacitor CLI globalmente...
call npm install -g @capacitor/cli

echo.
echo [2/4] Instalando Live Updates CLI...
call npm install -g @capacitor/live-updates

echo.
echo [3/4] Verificando instalacion...
call npx cap --version
call npx @capacitor/live-updates --version

echo.
echo [4/4] Configurando proyecto...
echo.
echo IMPORTANTE: Para completar la configuracion necesitas:
echo.
echo 1. Crear una cuenta en Capacitor Cloud (https://capacitorjs.com/cloud)
echo 2. Crear una nueva app con ID: com.rentaflux.app
echo 3. Obtener tu API Key desde el dashboard
echo 4. Ejecutar: npx @capacitor/live-updates login
echo 5. Configurar tu app: npx @capacitor/live-updates init
echo.
echo Una vez completados estos pasos, podras usar:
echo - scripts/deploy-with-live-updates.bat production
echo - scripts/deploy-with-live-updates.bat staging
echo.
echo ========================================
echo  CONFIGURACION INICIAL COMPLETADA
echo ========================================
pause