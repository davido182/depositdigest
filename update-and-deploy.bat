@echo off
echo 🚀 ACTUALIZANDO RENTAFLUX...
echo.

echo 📝 Agregando cambios a Git...
git add .

echo 💬 Creando commit...
set /p commit_message="Ingresa el mensaje del commit (o presiona Enter para usar mensaje por defecto): "
if "%commit_message%"=="" set commit_message="Mejoras en UI móvil y formularios"

git commit -m "%commit_message%"

echo 📤 Subiendo a GitHub...
git push origin main

echo 🌐 Desplegando a Netlify...
npm run build

echo 📱 Generando APK actualizado...
npm run build:mobile

echo ✅ PROCESO COMPLETADO
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Ve a Android Studio
echo 2. Ejecuta: gradlew.bat clean
echo 3. Ejecuta: gradlew.bat assembleDebug
echo 4. Instala el nuevo APK en tu móvil
echo.
echo 🔄 ALTERNATIVA RÁPIDA (Hot Reload):
echo 1. Ejecuta: npm run dev
echo 2. En tu móvil, ve a: http://[tu-ip]:8081
echo 3. Los cambios se actualizan automáticamente
echo.
pause