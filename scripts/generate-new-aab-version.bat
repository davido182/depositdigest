@echo off
echo 🔄 GENERAR NUEVA VERSIÓN AAB
echo ============================

echo.
echo 🎯 Versión actualizada: 1.0.1 (versionCode 2)

echo.
echo 1. CONSTRUIR APP:
call npm run build

echo.
echo 2. SINCRONIZAR:
call npx cap sync android

echo.
echo 3. ABRIR ANDROID STUDIO:
call npx cap open android

echo.
echo 📋 EN ANDROID STUDIO:
echo 1. Build > Generate Signed Bundle / APK
echo 2. Android App Bundle
echo 3. Usar MISMO keystore anterior
echo 4. Release
echo 5. Finish

echo.
echo ✅ NUEVO AAB: android\app\build\outputs\bundle\release\app-release.aab
echo 📱 VERSIÓN: 1.0.1 (código 2)
echo.
pause