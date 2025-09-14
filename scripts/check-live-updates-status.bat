@echo off
echo 📊 VERIFICANDO ESTADO DE LIVE UPDATES
echo ====================================

echo.
echo 🔍 Verificando configuración de Ionic...
call ionic config list 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ionic CLI no configurado correctamente
    echo Ejecuta: ionic login
    pause
    exit /b 1
)

echo.
echo 📱 Verificando proyecto vinculado...
call ionic deploy list --app-id com.rentaflux.app 2>nul
if %errorlevel% neq 0 (
    echo ❌ Proyecto no vinculado o sin despliegues
    echo Ejecuta: scripts\setup-live-updates-completo.bat
    pause
    exit /b 1
)

echo.
echo ✅ LIVE UPDATES CONFIGURADO CORRECTAMENTE!
echo =========================================
echo.
echo 📋 Comandos útiles:
echo - Ver despliegues: ionic deploy list --app-id com.rentaflux.app
echo - Desplegar actualización: scripts\deploy-live-update.bat
echo - Ver configuración: ionic config list
echo.
pause