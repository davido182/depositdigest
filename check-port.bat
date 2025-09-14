@echo off
echo 🔍 Verificando puertos de RentaFlux...
echo.

echo 📊 Puertos en uso:
netstat -ano | findstr :808

echo.
echo 🔍 Verificando puerto específico de RentaFlux...

netstat -ano | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo ✅ Puerto 8080: EN USO
) else (
    echo ❌ Puerto 8080: LIBRE
)

netstat -ano | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo ✅ Puerto 8081: EN USO
) else (
    echo ❌ Puerto 8081: LIBRE
)

echo.
echo 💡 Si tu aplicación está en 8081, todos los scripts están actualizados.
echo 💡 Si quieres forzar el puerto 8080, cierra otras aplicaciones que lo usen.
echo.
pause