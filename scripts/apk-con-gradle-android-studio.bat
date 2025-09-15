@echo off
echo ========================================
echo USANDO GRADLE DE ANDROID STUDIO
echo ========================================

echo.
echo 1. Buscando Gradle de Android Studio...
set ANDROID_STUDIO_GRADLE=""

if exist "C:\Program Files\Android\Android Studio\gradle\gradle-8.5" (
    set ANDROID_STUDIO_GRADLE=C:\Program Files\Android\Android Studio\gradle\gradle-8.5
)

if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk\gradle\gradle-8.5" (
    set ANDROID_STUDIO_GRADLE=C:\Users\%USERNAME%\AppData\Local\Android\Sdk\gradle\gradle-8.5
)

if exist "C:\Users\%USERNAME%\.gradle\wrapper\dists\gradle-8.5-bin" (
    for /d %%i in ("C:\Users\%USERNAME%\.gradle\wrapper\dists\gradle-8.5-bin\*") do (
        if exist "%%i\gradle-8.5"e (
            set ANDROID_STUDIO_GRADLE=%%i\gradle-8.5
        )
    )
)

echo Gradle encontrado en: %ANDROID_STUDIO_GRADLE%

echo.
echo 2. Configurando variables...
set JAVA_HOME=C:\Program Files\Java\jdk-24
set GRADLE_HOME=%ANDROID_STUDIO_GRADLE%

echo.
echo 3. Limpiando proyecto...
cd android
if exist "build" rmdir /s /q build
if exist "app\build" rmdir /s /q app\build

echo.
echo 4. Usando Gradle directo...
if not "%ANDROID_STUDIO_GRADLE%"=="" (
    "%ANDROID_STUDIO_GRADLE%\bin\gradle.bat" clean assembleDebug
) else (
    echo No se encontro Gradle de Android Studio
    echo Intentando con gradlew local...
    .\gradlew.bat clean assembleDebug
)

cd ..

echo.
echo ========================================
echo APK generado en:
echo android\app\build\outputs\apk\debug\
echo ========================================
pause