# 🤖 Despliegue Android - RentaFlux

## Prerrequisitos

1. **Cuenta de Google Play Console** ($25 USD una sola vez)
   - Registrarse en: https://play.google.com/console
   - Completar verificación de identidad

2. **Android Studio**
   - Descargar desde: https://developer.android.com/studio
   - Instalar SDK de Android

## Pasos de Configuración

### 1. Preparar el Proyecto
```bash
# Construir la aplicación web
npm run build

# Sincronizar con Capacitor
npm run cap:sync

# Abrir en Android Studio
npm run cap:open:android
```

### 2. Configurar en Android Studio

1. **Application ID**: `com.rentaflux.app`
2. **App Name**: `RentaFlux`
3. **Version Name**: `1.0.0`
4. **Version Code**: `1`

### 3. Generar Signing Key

```bash
# Crear keystore para firma
keytool -genkey -v -keystore rentaflux-release-key.keystore -alias rentaflux -keyalg RSA -keysize 2048 -validity 10000

# Información requerida:
# - Nombre: RentaFlux
# - Organización: Tu empresa
# - Ciudad: Tu ciudad
# - Estado: Tu estado/provincia
# - País: ES (o tu código de país)
```

### 4. Configurar Build para Release

**En `android/app/build.gradle`:**
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../rentaflux-release-key.keystore')
            storePassword 'tu_password_keystore'
            keyAlias 'rentaflux'
            keyPassword 'tu_password_key'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 5. Construir APK/AAB

```bash
# Para AAB (recomendado para Play Store)
./gradlew bundleRelease

# Para APK (testing)
./gradlew assembleRelease
```

### 6. Crear App en Play Console

1. **Ir a Play Console**: https://play.google.com/console
2. **Crear Aplicación**:
   - Nombre: RentaFlux
   - Idioma predeterminado: Español
   - Tipo: Aplicación
   - Gratuita/De pago: Gratuita

### 7. Configurar Ficha de Play Store

**Detalles de la App:**
- Nombre: RentaFlux
- Descripción corta: "Gestión inmobiliaria integral para propietarios"

**Descripción completa:**
```
🏢 RentaFlux - La solución completa para gestionar tus propiedades de alquiler

GESTIÓN INTEGRAL
• Administra inquilinos y contratos de forma digital
• Seguimiento automático de pagos y vencimientos
• Sistema de mantenimiento con seguimiento de estado
• Contabilidad integrada con reportes automáticos

CARACTERÍSTICAS DESTACADAS
✅ Dashboard intuitivo con métricas clave
✅ Invitaciones digitales para nuevos inquilinos
✅ Notificaciones automáticas de pagos
✅ Generación de reportes financieros
✅ Asistente IA para consultas rápidas
✅ Sincronización en tiempo real

BENEFICIOS
🎯 Ahorra tiempo en tareas administrativas
📊 Mejora el control financiero
💬 Facilita la comunicación con inquilinos
📱 Acceso desde cualquier dispositivo
🔒 Datos seguros y respaldados

Ideal para propietarios individuales, administradores de fincas y empresas inmobiliarias que buscan digitalizar y optimizar sus procesos de alquiler.

¡Descarga RentaFlux y transforma la gestión de tus propiedades!
```

### 8. Assets Gráficos

**Iconos requeridos:**
- Icono de aplicación: 512x512px
- Icono adaptativo: 512x512px (foreground + background)

**Screenshots (mínimo 2, máximo 8):**
- Teléfonos: 1080x1920px o 1080x2340px
- Tablets 7": 1200x1920px
- Tablets 10": 1800x2560px

### 9. Clasificación de Contenido

**Cuestionario de clasificación:**
- Violencia: No
- Contenido sexual: No
- Lenguaje soez: No
- Drogas: No
- Apuestas simuladas: No
- Compras digitales: Sí (suscripción premium)

**Resultado esperado:** Para todos

### 10. Política de Privacidad

**URL requerida:** https://rentaflux.com/privacy

**Debe incluir:**
- Qué datos recopila la app
- Cómo se usan los datos
- Con quién se comparten
- Cómo contactar para consultas

### 11. Configurar Lanzamiento

**Países/regiones:**
- España (principal)
- Latinoamérica
- Estados Unidos

**Tipo de lanzamiento:**
- Lanzamiento de producción
- Porcentaje: 100%

### 12. Envío para Revisión

1. **Subir AAB**:
   - Ir a "Versiones de producción"
   - Crear nueva versión
   - Subir el archivo AAB generado

2. **Completar información**:
   - Notas de la versión
   - Detalles de la app
   - Clasificación de contenido
   - Política de privacidad

3. **Enviar para revisión**

## Tiempos Estimados

- **Revisión inicial**: 1-3 días
- **Revisión completa**: 1-7 días
- **Publicación**: Inmediata tras aprobación

## Checklist Final

- [ ] Application ID configurado: com.rentaflux.app
- [ ] Keystore generado y configurado
- [ ] AAB construido correctamente
- [ ] Screenshots subidos para todos los tamaños
- [ ] Descripción completa y atractiva
- [ ] Política de privacidad publicada
- [ ] Clasificación de contenido completada
- [ ] Países de lanzamiento seleccionados
- [ ] Enviado para revisión

## Comandos Útiles

```bash
# Verificar firma del APK
jarsigner -verify -verbose -certs app-release.apk

# Ver información del keystore
keytool -list -v -keystore rentaflux-release-key.keystore

# Limpiar y reconstruir
./gradlew clean
./gradlew bundleRelease
```