@echo off
echo 🌐 Configurando dominio rentaflux.com para desarrollo...
echo.

echo 📋 Pasos para conectar tu dominio:
echo.
echo 1. CONFIGURACIÓN DNS:
echo    - Ve al panel de control de tu dominio (donde compraste rentaflux.com)
echo    - Configura un registro A que apunte a tu IP pública
echo    - O configura un CNAME que apunte a tu túnel ngrok
echo.
echo 2. CONFIGURACIÓN LOCAL:
echo    - Instala un proxy reverso (nginx, caddy, o similar)
echo    - Configura SSL/TLS para HTTPS
echo    - Redirige el tráfico a localhost:8080
echo.
echo 3. ALTERNATIVA RÁPIDA (Recomendada):
echo    - Usa un servicio como ngrok, cloudflare tunnel, o similar
echo    - Conecta tu dominio al túnel
echo.

echo ¿Qué opción prefieres?
echo 1. Configurar túnel ngrok (Rápido)
echo 2. Configurar servidor web local (Avanzado)
echo 3. Ver instrucciones detalladas
echo.

set /p choice="Elige una opción (1-3): "

if "%choice%"=="1" (
    call scripts\setup-tunnel.bat
) else if "%choice%"=="2" (
    echo 🔧 Configuración avanzada de servidor web...
    echo Esta opción requiere conocimientos técnicos avanzados.
    echo Te recomendamos usar la opción 1 para desarrollo.
    pause
) else if "%choice%"=="3" (
    echo 📖 Abriendo guía detallada...
    start docs\domain-setup-guide.md
) else (
    echo ❌ Opción no válida
    pause
)

echo.
echo 💡 Consejo: Para desarrollo, usa ngrok. Para producción, configura un servidor web.
pause