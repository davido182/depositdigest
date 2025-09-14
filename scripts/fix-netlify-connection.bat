@echo off
echo 🔧 SOLUCIONANDO CONEXIÓN NETLIFY
echo ================================

echo.
echo 🚨 PROBLEMA DETECTADO:
echo • www.rentaflux.com apunta a Lovable (depositdigest.lovable.app)
echo • Nuestro trabajo está en GitHub con todas las mejoras
echo • Necesitamos conectar Netlify directamente a GitHub

echo.
echo 📋 PASOS PARA SOLUCIONARLO:

echo.
echo 🌐 1. CONFIGURAR NETLIFY CORRECTAMENTE:
echo    a) Ve a: https://app.netlify.com/
echo    b) Busca tu sitio "rentaflux" o similar
echo    c) Site settings > Build & deploy > Repository
echo    d) Desconecta de Lovable si está conectado
echo    e) Conecta a tu repositorio de GitHub

echo.
echo 🔗 2. CONECTAR A GITHUB:
echo    • Repository: tu-usuario/depositdigest (o el nombre de tu repo)
echo    • Branch: main
echo    • Build command: npm run build
echo    • Publish directory: dist

echo.
echo ⚙️ 3. CONFIGURAR BUILD SETTINGS:
echo    • Base directory: (dejar vacío)
echo    • Build command: npm run build
echo    • Publish directory: dist
echo    • Node version: 18

echo.
echo 🚀 4. VERIFICAR DEPLOYMENT:
echo    Después de conectar, Netlify debería:
echo    • Detectar el netlify.toml automáticamente
echo    • Hacer deploy desde GitHub
echo    • Mostrar todas nuestras mejoras

echo.
echo ✅ 5. RESULTADO ESPERADO:
echo    www.rentaflux.com debería mostrar:
echo    • Landing como página principal
echo    • ChatAssistant mejorado
echo    • Formulario de inquilinos sin campo obligatorio de propiedad
echo    • Todas las mejoras que hemos hecho

echo.
echo 💡 ALTERNATIVA RÁPIDA:
echo    Si no encuentras el sitio en Netlify:
echo    1. Crea un nuevo sitio en Netlify
echo    2. Conecta directamente a tu repo de GitHub
echo    3. Configura el dominio www.rentaflux.com

echo.
pause