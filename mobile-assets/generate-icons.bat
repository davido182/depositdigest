@echo off
echo 🎨 Generador de iconos para RentaFlux
echo.

echo 📋 Para generar todos los iconos necesarios:
echo.
echo 1. CREAR ICONO BASE:
echo    - Crea un icono de 1024x1024 píxeles
echo    - Formato PNG con fondo transparente o sólido
echo    - Guárdalo como: mobile-assets/icon-1024.png
echo.
echo 2. HERRAMIENTAS RECOMENDADAS:
echo    - App Icon Generator: https://appicon.co/
echo    - Icon Kitchen: https://icon.kitchen/
echo    - Capacitor Assets: npx @capacitor/assets generate
echo.
echo 3. COLORES DE MARCA RENTAFLUX:
echo    - Primario: #ff6b35 (naranja)
echo    - Secundario: #2563eb (azul)
echo    - Fondo: #ffffff (blanco)
echo.

if exist "mobile-assets\icon-1024.png" (
    echo ✅ Icono base encontrado: mobile-assets\icon-1024.png
    echo.
    echo 🚀 Generando iconos automáticamente...
    
    REM Verificar si @capacitor/assets está instalado
    npm list @capacitor/assets >nul 2>&1
    if %errorlevel% neq 0 (
        echo 📦 Instalando @capacitor/assets...
        npm install -D @capacitor/assets
    )
    
    echo 🎨 Generando iconos y splash screens...
    npx @capacitor/assets generate --iconBackgroundColor "#ffffff" --iconBackgroundColorDark "#000000" --splashBackgroundColor "#ffffff" --splashBackgroundColorDark "#000000"
    
    echo ✅ ¡Iconos generados exitosamente!
    
) else (
    echo ❌ No se encontró el icono base
    echo.
    echo 📝 Instrucciones:
    echo 1. Crea un icono de 1024x1024 píxeles
    echo 2. Guárdalo como: mobile-assets\icon-1024.png
    echo 3. Ejecuta este script de nuevo
    echo.
    echo 💡 Puedes usar cualquier herramienta de diseño:
    echo    - Photoshop, GIMP, Canva, Figma, etc.
    echo    - O descargar iconos gratuitos de Flaticon, Icons8, etc.
)

echo.
echo 📱 Estructura de iconos que se generarán:
echo.
echo Android:
echo   - res/mipmap-hdpi/ic_launcher.png (72x72)
echo   - res/mipmap-mdpi/ic_launcher.png (48x48)
echo   - res/mipmap-xhdpi/ic_launcher.png (96x96)
echo   - res/mipmap-xxhdpi/ic_launcher.png (144x144)
echo   - res/mipmap-xxxhdpi/ic_launcher.png (192x192)
echo.
echo iOS:
echo   - Assets.xcassets/AppIcon.appiconset/ (múltiples tamaños)
echo.
pause