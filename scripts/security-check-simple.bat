@echo off
echo 🔒 Verificación de seguridad simple para RentaFlux
echo.

echo Verificando archivos de entorno...

if exist .env.local (
    echo ✅ .env.local existe
) else (
    echo ❌ .env.local no existe
)

if exist .env.example (
    echo ✅ .env.example existe como referencia
) else (
    echo ⚠️ .env.example no existe
)

echo.
echo Verificando que .env.local no esté en Git...
git ls-files .env.local >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ ERROR: .env.local está en Git - ejecuta: git rm --cached .env.local
) else (
    echo ✅ .env.local no está en Git
)

echo.
echo Verificando .gitignore...
findstr /C:".env.local" .gitignore >nul
if %errorlevel% equ 0 (
    echo ✅ .env.local está en .gitignore
) else (
    echo ❌ .env.local no está en .gitignore
)

echo.
echo 📊 Verificación completada
echo.
echo 💡 Para verificación completa, ejecuta:
echo    powershell -ExecutionPolicy Bypass -File scripts/security-check.ps1
echo.
pause