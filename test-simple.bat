@echo off
echo Probando comandos basicos...
echo.

echo 1. Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js no encontrado
    pause
    exit
)

echo.
echo 2. Verificando npm...
npm --version
if errorlevel 1 (
    echo ERROR: npm no encontrado
    pause
    exit
)

echo.
echo 3. Verificando directorio actual...
dir package.json
if errorlevel 1 (
    echo ERROR: No estas en el directorio correcto del proyecto
    pause
    exit
)

echo.
echo 4. Probando npm install...
call npm install
if errorlevel 1 (
    echo ERROR: npm install fallo
    pause
    exit
)

echo.
echo 5. Probando build...
call npm run build
if errorlevel 1 (
    echo ERROR: build fallo
    pause
    exit
)

echo.
echo ========================================
echo TODOS LOS TESTS PASARON!
echo ========================================
echo.
echo Ahora puedes ejecutar: setup-completo.bat
pause