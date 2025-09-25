@echo off
echo 🏪 GENERAR AAB PARA GOOGLE PLAY STORE
echo ===================================

echo.
echo 🎯 OBJETIVO: Crear Android App Bundle (.aab) para Play Store
echo Google Play Store requiere AAB, no APK para nuevas apps

echo.
echo 📋 PASOS PARA GENERAR AAB:

echo.
echo 1. CONSTRUIR LA APP:
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error al construir la app
    pause
    exit /b 1
)

echo.
echo 2. SINCRONIZAR CAPACITOR:
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Error al sincronizar Capacitor
    pause
    exit /b 1
)

echo.
echo 3. ABRIR ANDROID STUDIO:
call npx cap open android

echo.
echo 📋 EN ANDROID STUDIO:
echo 1. Build > Generate Signed Bundle / APK
echo 2. Selecciona "Android App Bundle"
echo 3. Crea o selecciona tu keystore
echo 4. Selecciona "release"
echo 5. Clic "Finish"

echo.
echo 📁 EL AAB ESTARÁ EN:
echo android\app\build\outputs\bundle\release\app-release.aab

echo.
echo ✅ ESTE ARCHIVO (.aab) ES EL QUE SUBES A PLAY STORE
echo.
pause