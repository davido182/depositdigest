@echo off
echo ========================================
echo  RentaFlux - Configurar Capacitor Cloud
echo ========================================

echo.
echo Este script te guiara para configurar Capacitor Cloud
echo para actualizaciones automaticas de la app.
echo.

echo [1/5] Instalando herramientas necesarias...
call npm install -g @capacitor/cli @capacitor/live-updates

echo.
echo [2/5] Verificando instalacion...
call npx cap --version
call npx @capacitor/live-updates --version

echo.
echo [3/5] Configuracion de Capacitor Cloud
echo.
echo PASOS A SEGUIR:
echo.
echo 1. Ve a: https://capacitorjs.com/cloud
echo 2. Crea una cuenta gratuita (incluye 10,000 actualizaciones/mes)
echo 3. Crea una nueva app con estos datos:
echo    - App ID: com.rentaflux.app
echo    - Nombre: RentaFlux
echo    - Plataforma: Android (y iOS si planeas usarlo)
echo.
echo 4. Copia tu API Key del dashboard
echo.
echo Presiona cualquier tecla cuando hayas creado la cuenta...
pause

echo.
echo [4/5] Autenticacion con Capacitor Cloud...
echo.
echo Ejecuta este comando y sigue las instrucciones:
echo.
echo npx @capacitor/live-updates login
echo.
pause

echo.
echo [5/5] Inicializar proyecto...
echo.
echo Ejecuta este comando para configurar tu app:
echo.
echo npx @capacitor/live-updates init
echo.
echo Cuando te pregunte:
echo - App ID: com.rentaflux.app
echo - Channel: production
echo.
pause

echo.
echo ========================================
echo  CONFIGURACION COMPLETADA
echo ========================================
echo.
echo Ahora puedes usar:
echo - npm run live-updates:deploy (produccion)
echo - npm run live-updates:deploy:staging (pruebas)
echo.
echo Las actualizaciones llegaran a los usuarios en 5-30 minutos
echo sin necesidad de actualizar desde Play Store.
echo.
pause