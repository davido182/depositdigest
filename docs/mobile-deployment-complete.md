# 📱 Guía Completa de Deployment Móvil - RentaFlux

## 🚀 Preparación Inicial

### Prerrequisitos
- ✅ Node.js 18+ instalado
- ✅ npm funcionando
- ✅ Proyecto RentaFlux configurado
- ✅ Variables de entorno configuradas

### Para Android:
- Android Studio instalado
- SDK de Android configurado
- Dispositivo Android o emulador

### Para iOS (solo Mac):
- Xcode instalado
- Cuenta de Apple Developer ($99/año)
- Dispositivo iOS o simulador

## 🔧 Comandos Rápidos

### Build Completo
```bash
# Build para ambas plataformas (producción)
npm run mobile:build

# Build solo Android
npm run mobile:build:android

# Build solo iOS (Mac únicamente)
npm run mobile:build:ios

# Build para staging
npm run mobile:build:staging
```

### Desarrollo y Testing
```bash
# Desarrollo en Android
npm run mobile:dev:android

# Desarrollo en iOS
npm run mobile:dev:ios

# Abrir en IDE
npm run cap:open:android    # Android Studio
npm run cap:open:ios        # Xcode (Mac)
```

## 📋 Proceso Paso a Paso

### Paso 1: Preparar el Build Web
```bash
# Asegurarse de que todo funciona en web
npm run dev

# Verificar configuración
npm run security-check

# Build para móvil
npm run build:mobile
```

### Paso 2: Configurar Plataformas Móviles

#### Android
```bash
# Agregar plataforma Android
npm run cap:add:android

# Sincronizar cambios
npm run cap:sync

# Abrir en Android Studio
npm run cap:open:android
```

#### iOS (solo Mac)
```bash
# Agregar plataforma iOS
npm run cap:add:ios

# Sincronizar cambios
npm run cap:sync

# Abrir en Xcode
npm run cap:open:ios
```

### Paso 3: Configurar Assets

#### Iconos de Aplicación
1. **Crear icono base**: 1024x1024px en formato PNG
2. **Generar todos los tamaños**: Usar [App Icon Generator](https://appicon.co/)
3. **Colocar en carpetas correspondientes**: Ver `mobile-assets/icons/README.md`

#### Splash Screens
1. **Android**: Colocar en `android/app/src/main/res/drawable/`
2. **iOS**: Configurar en Xcode Assets

### Paso 4: Configuración Específica por Plataforma

#### Android - Configuración en Android Studio

1. **Abrir proyecto**:
   ```bash
   npm run cap:open:android
   ```

2. **Configurar app/build.gradle**:
   ```gradle
   android {
       compileSdkVersion 34
       defaultConfig {
           applicationId "com.rentaflux.app"
           minSdkVersion 22
           targetSdkVersion 34
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

3. **Configurar permisos en AndroidManifest.xml**:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   ```

4. **Generar keystore para firma**:
   ```bash
   keytool -genkey -v -keystore rentaflux-release-key.keystore -alias rentaflux -keyalg RSA -keysize 2048 -validity 10000
   ```

5. **Configurar signing en build.gradle**:
   ```gradle
   signingConfigs {
       release {
           storeFile file('../../rentaflux-release-key.keystore')
           storePassword 'tu_password'
           keyAlias 'rentaflux'
           keyPassword 'tu_password'
       }
   }
   ```

#### iOS - Configuración en Xcode

1. **Abrir proyecto**:
   ```bash
   npm run cap:open:ios
   ```

2. **Configurar Bundle Identifier**: `com.rentaflux.app`

3. **Configurar Team**: Seleccionar tu Apple Developer Team

4. **Configurar Signing**: Automático (recomendado)

5. **Configurar Info.plist**:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>RentaFlux necesita acceso a la cámara para tomar fotos de propiedades</string>
   <key>NSPhotoLibraryUsageDescription</key>
   <string>RentaFlux necesita acceso a la galería para seleccionar fotos</string>
   ```

## 🏗️ Build para Distribución

### Android - Generar APK/AAB

1. **En Android Studio**:
   - Build > Generate Signed Bundle/APK
   - Seleccionar "Android App Bundle" (recomendado para Play Store)
   - Usar keystore creado anteriormente
   - Seleccionar "release"

2. **Por línea de comandos**:
   ```bash
   cd android
   ./gradlew bundleRelease    # Para AAB
   ./gradlew assembleRelease  # Para APK
   ```

### iOS - Generar IPA

1. **En Xcode**:
   - Product > Archive
   - Distribuir a App Store o Ad Hoc
   - Seguir el asistente de distribución

## 📤 Subir a Tiendas

### Google Play Store

1. **Crear cuenta de desarrollador**: $25 USD (una sola vez)
2. **Ir a Play Console**: https://play.google.com/console
3. **Crear nueva aplicación**:
   - Nombre: RentaFlux
   - Idioma: Español
   - Tipo: Aplicación
4. **Subir AAB**: En "Versiones de producción"
5. **Completar información**:
   - Descripción
   - Screenshots
   - Política de privacidad
   - Clasificación de contenido

### Apple App Store

1. **Cuenta Apple Developer**: $99 USD/año
2. **Ir a App Store Connect**: https://appstoreconnect.apple.com
3. **Crear nueva app**:
   - Nombre: RentaFlux
   - Bundle ID: com.rentaflux.app
   - SKU: rentaflux-ios
4. **Subir build**: Desde Xcode con Archive
5. **Completar información**:
   - Descripción
   - Screenshots
   - Información de revisión

## 🧪 Testing

### Testing Local
```bash
# Ejecutar en dispositivo Android
npm run cap:run:android

# Ejecutar en simulador iOS
npm run cap:run:ios

# Testing con hot reload
npm run mobile:dev:android
npm run mobile:dev:ios
```

### Testing de Distribución
1. **Android**: Instalar APK en dispositivos de prueba
2. **iOS**: Usar TestFlight para distribución beta

## 🔧 Troubleshooting

### Problemas Comunes

#### Error de build web
```bash
# Limpiar y reinstalar
rm -rf node_modules dist
npm install
npm run build
```

#### Error de Capacitor sync
```bash
# Limpiar Capacitor
npx cap clean
npm run cap:sync
```

#### Error de Android build
```bash
# Limpiar proyecto Android
cd android
./gradlew clean
cd ..
npm run cap:sync
```

#### Error de iOS build
- Verificar certificados de firma
- Limpiar build folder en Xcode
- Verificar Bundle ID único

### Logs y Debugging
```bash
# Ver logs de Android
npx cap run android --livereload

# Ver logs de iOS
npx cap run ios --livereload

# Logs de Capacitor
npx cap doctor
```

## 📊 Checklist de Deployment

### Pre-deployment
- [ ] Aplicación funciona correctamente en web
- [ ] Variables de entorno configuradas
- [ ] Tests de seguridad pasados
- [ ] Iconos y assets preparados

### Android
- [ ] Android Studio instalado y configurado
- [ ] Keystore generado y guardado seguramente
- [ ] Permisos configurados en AndroidManifest.xml
- [ ] APK/AAB generado y probado
- [ ] Cuenta de Google Play Console creada

### iOS
- [ ] Xcode instalado (Mac)
- [ ] Cuenta Apple Developer activa
- [ ] Bundle ID configurado
- [ ] Certificados de firma válidos
- [ ] IPA generado y probado
- [ ] App Store Connect configurado

### Post-deployment
- [ ] Aplicación probada en dispositivos reales
- [ ] Screenshots tomados para tiendas
- [ ] Descripción y metadata completados
- [ ] Política de privacidad publicada
- [ ] Aplicación enviada para revisión

## 🎯 Próximos Pasos

1. **Ejecutar build inicial**: `npm run mobile:build`
2. **Probar en emulador/simulador**
3. **Configurar iconos y assets**
4. **Generar builds de distribución**
5. **Crear cuentas de desarrollador**
6. **Subir a tiendas para revisión**

¡Tu aplicación RentaFlux está lista para el mundo móvil! 🚀