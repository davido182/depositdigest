@echo off
echo ========================================
echo REGENERANDO GRADLE WRAPPER COMPLETO
echo ========================================

echo.
echo 1. Eliminando Gradle Wrapper corrupto...
cd android
if exist "gradle\wrapper" rmdir /s /q gradle\wrapper
if exist "gradlew.bat" del gradlew.bat
if exist "gradlew" del gradlew

echo.
echo 2. Descargando Gradle Wrapper nuevo...
mkdir gradle\wrapper

echo.
echo 3. Creando gradle-wrapper.properties...
echo distributionBase=GRADLE_USER_HOME > gradle\wrapper\gradle-wrapper.properties
echo distributionPath=wrapper/dists >> gradle\wrapper\gradle-wrapper.properties
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip >> gradle\wrapper\gradle-wrapper.properties
echo zipStoreBase=GRADLE_USER_HOME >> gradle\wrapper\gradle-wrapper.properties
echo zipStorePath=wrapper/dists >> gradle\wrapper\gradle-wrapper.properties

echo.
echo 4. Descargando gradle-wrapper.jar...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/raw/v8.5.0/gradle/wrapper/gradle-wrapper.jar' -OutFile 'gradle\wrapper\gradle-wrapper.jar'"

echo.
echo 5. Creando gradlew.bat...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/raw/v8.5.0/gradlew.bat' -OutFile 'gradlew.bat'"

echo.
echo 6. Creando gradlew (Unix)...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/raw/v8.5.0/gradlew' -OutFile 'gradlew'"

cd ..

echo.
echo ========================================
echo GRADLE WRAPPER REGENERADO!
echo Ahora intentando generar APK...
echo ========================================

cd android
.\gradlew.bat assembleDebug
cd ..

echo.
echo APK generado en: android\app\build\outputs\apk\debug\
pause