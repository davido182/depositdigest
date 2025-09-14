# 🤖 Configuración Detallada de Android - RentaFlux

## 📋 Prerrequisitos

### 1. Instalar Android Studio
- Descargar desde: https://developer.android.com/studio
- Instalar con configuración por defecto
- Aceptar licencias del SDK

### 2. Configurar Variables de Entorno
```bash
# Agregar al PATH del sistema:
ANDROID_HOME=C:\Users\TuUsuario\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\TuUsuario\AppData\Local\Android\Sdk
```

### 3. Instalar Herramientas del SDK
En Android Studio:
- Tools > SDK Manager
- Instalar Android SDK Platform-Tools
- Instalar Android SDK Build-Tools
- Instalar Android 13 (API level 33) o superior

## 🏗️ Configuración del Proyecto

### 1. Agregar Plataforma Android
```bash
npx cap add android
```

### 2. Configurar android/app/build.gradle
```gradle
android {
    namespace "com.rentaflux.app"
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.rentaflux.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // Files and dirs to omit from the packaged APK.
             ignoreAssetsPattern "!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~"
        }
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Configurar Permisos en AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Deep linking -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https"
                      android:host="rentaflux.com" />
            </intent-filter>
            
        </activity>
        
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>
</manifest>
```

## 🔑 Configuración de Firma (Release)

### 1. Generar Keystore
```bash
keytool -genkey -v -keystore rentaflux-release-key.keystore -alias rentaflux -keyalg RSA -keysize 2048 -validity 10000
```

Información requerida:
- Nombre: RentaFlux
- Unidad organizacional: Tu empresa
- Organización: Tu empresa
- Ciudad: Tu ciudad
- Estado: Tu estado/provincia
- Código de país: ES (o tu país)

### 2. Configurar Signing en build.gradle
```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 3. Crear gradle.properties
```properties
MYAPP_RELEASE_STORE_FILE=../rentaflux-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=rentaflux
MYAPP_RELEASE_STORE_PASSWORD=tu_password_keystore
MYAPP_RELEASE_KEY_PASSWORD=tu_password_key
```

## 🎨 Configuración de Iconos y Splash

### 1. Iconos de Aplicación
Colocar en `android/app/src/main/res/`:
```
mipmap-hdpi/ic_launcher.png (72x72)
mipmap-mdpi/ic_launcher.png (48x48)
mipmap-xhdpi/ic_launcher.png (96x96)
mipmap-xxhdpi/ic_launcher.png (144x144)
mipmap-xxxhdpi/ic_launcher.png (192x192)
```

### 2. Splash Screen
Colocar en `android/app/src/main/res/drawable/`:
```
splash.png (2732x2732 recomendado)
```

## 🚀 Build y Testing

### 1. Build de Desarrollo
```bash
# Sincronizar cambios
npx cap sync android

# Abrir en Android Studio
npx cap open android

# O ejecutar directamente
npx cap run android
```

### 2. Build de Release
```bash
# En Android Studio:
# Build > Generate Signed Bundle/APK
# Seleccionar Android App Bundle (AAB)
# Usar keystore creado anteriormente

# O por línea de comandos:
cd android
./gradlew bundleRelease
```

### 3. Testing
```bash
# Ejecutar en dispositivo conectado
npx cap run android --target=device_id

# Ejecutar en emulador
npx cap run android --target=emulator_name

# Con live reload
npx cap run android --livereload --external
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **Gradle build failed**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew build
   ```

2. **SDK not found**
   - Verificar ANDROID_HOME en variables de entorno
   - Reinstalar Android SDK desde Android Studio

3. **Device not found**
   ```bash
   adb devices
   adb kill-server
   adb start-server
   ```

4. **Capacitor sync issues**
   ```bash
   npx cap clean android
   npx cap sync android
   ```

### Logs y Debugging
```bash
# Ver logs del dispositivo
adb logcat

# Ver logs específicos de la app
adb logcat | grep RentaFlux

# Logs de Capacitor
npx cap run android --livereload --external
```

## 📤 Distribución

### Google Play Store

1. **Crear cuenta de desarrollador**: $25 USD (una sola vez)
2. **Ir a Play Console**: https://play.google.com/console
3. **Crear nueva aplicación**
4. **Subir AAB generado**
5. **Completar información de la tienda**
6. **Enviar para revisión**

### Distribución Directa (APK)

1. **Generar APK firmado**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Distribuir APK**:
   - Subir a tu servidor web
   - Enviar por email
   - Usar servicios como Firebase App Distribution

## ✅ Checklist Final

- [ ] Android Studio instalado y configurado
- [ ] SDK y herramientas instaladas
- [ ] Proyecto Capacitor sincronizado
- [ ] Permisos configurados en AndroidManifest.xml
- [ ] Iconos y splash screens agregados
- [ ] Keystore generado para release
- [ ] Build de desarrollo probado
- [ ] Build de release generado
- [ ] Aplicación probada en dispositivo real

¡Tu aplicación Android está lista para distribución! 🎉