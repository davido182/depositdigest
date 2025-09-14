@echo off
echo ========================================
echo 📱 SERVIDOR PARA MÓVIL - RENTAFLUX
echo ========================================
echo.

echo 🔍 Tu IP local es:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "192.168"') do (
    set ip=%%a
    set ip=!ip: =!
    echo    📍 !ip!
)

echo.
echo 🚀 Iniciando servidor accesible desde móvil...
echo.
echo ========================================
echo 📱 PARA PROBAR EN TU MÓVIL:
echo ========================================
echo.
echo 1️⃣  Conecta tu móvil a la misma WiFi
echo 2️⃣  Abre el navegador en tu móvil
echo 3️⃣  Ve a una de estas URLs:
echo.
echo    📍 http://192.168.33.1:8081
echo    📍 http://192.168.199.1:8081  
echo    📍 http://10.150.210.93:8081
echo.
echo 4️⃣  ¡Explora tu app RentaFlux!
echo.
echo ✨ BONUS: Puedes "instalarla" como app:
echo    - Toca el menú del navegador (3 puntos)
echo    - Selecciona "Añadir a pantalla de inicio"
echo    - ¡Ya tienes la app instalada!
echo.
echo ========================================
echo.

echo ⚠️  Mantén esta ventana abierta mientras pruebas
echo.

npm run dev -- --host 0.0.0.0 --port 8081