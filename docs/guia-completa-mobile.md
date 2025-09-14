# 📱 Guía Completa: De Código a App Store

## 🎯 Opción 1: APK para Android (Más Rápido)

### Paso 1: Generar APK
```bash
# Ejecuta estos comandos en orden:
npm run build:mobile:android
cd android
./gradlew assembleDebug
```

### Paso 2: Encontrar el APK
El archivo estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Paso 3: Compartir APK
```bash
# Copia el APK a una carpeta fácil
copy "android\app\build\outputs\apk\debug\app-debug.apk" "RentaFlux-Android.apk"
```

### Paso 4: Distribuir
- Sube el APK a Google Drive, Dropbox, o tu servidor
- Comparte el enlace de descarga
- Los usuarios deben habilitar "Fuentes desconocidas" en Android

---

## 🏪 Opción 2: Google Play Store (Oficial)

### Requisitos previos:
- Cuenta de Google Play Developer ($25 USD una vez)
- APK firmado digitalmente
- Íconos y screenshots
- Descripción de la app

### Paso 1: Preparar APK de producción
```bash
# Generar APK firmado
npm run build:mobile:android:release
```

### Paso 2: Crear keystore (certificado)
```bash
cd android
keytool -genkey -v -keystore rentaflux-release-key.keystore -alias rentaflux -keyalg RSA -keysize 2048 -validity 10000
```

### Paso 3: Configurar firma
Edita `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('rentaflux-release-key.keystore')
            storePassword 'tu-password'
            keyAlias 'rentaflux'
            keyPassword 'tu-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Paso 4: Generar APK firmado
```bash
./gradlew assembleRelease
```

### Paso 5: Subir a Play Store
1. Ve a https://play.google.com/console
2. Crea nueva aplicación
3. Sube el APK firmado
4. Completa información requerida
5. Envía para revisión (2-3 días)

---

## 🍎 Opción 3: iOS App Store

### Requisitos previos:
- Mac con Xcode
- Cuenta Apple Developer ($99 USD/año)
- Certificados de desarrollo

### Paso 1: Abrir en Xcode
```bash
npm run build:mobile:ios
open ios/App/App.xcworkspace
```

### Paso 2: Configurar certificados
1. En Xcode: Signing & Capabilities
2. Selecciona tu Team (Apple Developer)
3. Xcode manejará certificados automáticamente

### Paso 3: Generar build
1. Product → Archive
2. Distribute App
3. App Store Connect
4. Upload

### Paso 4: App Store Connect
1. Ve a https://appstoreconnect.apple.com
2. Crea nueva app
3. Sube screenshots e información
4. Envía para revisión (1-7 días)

---

## 🚀 Opción 4: Distribución Web (PWA)

### Más simple y rápido:
```bash
# Tu app ya es una PWA
# Los usuarios pueden "instalarla" desde el navegador
```

### Ventajas:
- No necesita app stores
- Actualizaciones automáticas
- Funciona en todos los dispositivos
- Sin comisiones de tiendas

### Instrucciones para usuarios:
1. Abrir https://rentaflux.tu-dominio.com
2. En Chrome/Safari: "Añadir a pantalla de inicio"
3. La app se comporta como nativa

---

## 📋 Checklist antes de publicar

### Para cualquier opción:
- [ ] Íconos en todas las resoluciones
- [ ] Screenshots de la aplicación
- [ ] Descripción atractiva
- [ ] Política de privacidad
- [ ] Términos de servicio
- [ ] Configuración de pagos (si aplica)

### Archivos necesarios:
- [ ] `mobile-assets/icons/` (todos los tamaños)
- [ ] Screenshots en `mobile-assets/screenshots/`
- [ ] Descripción en español e inglés
- [ ] Política de privacidad en tu dominio

---

## ⚡ Recomendación INMEDIATA

**Para empezar YA:**
1. Genera APK (Opción 1)
2. Configura PWA para iOS
3. Mientras tanto, prepara Play Store

**Comando rápido:**
```bash
# Ejecuta esto ahora:
build-mobile.bat
```

Esto generará todo lo necesario para distribución inmediata.