# 🍎 Despliegue iOS - RentaFlux

## Prerrequisitos

1. **Cuenta de Apple Developer** ($99 USD/año)
   - Registrarse en: https://developer.apple.com
   - Completar verificación de identidad

2. **Mac con Xcode** (requerido)
   - Descargar Xcode desde App Store
   - Instalar Command Line Tools

## Pasos de Configuración

### 1. Preparar el Proyecto
```bash
# Construir la aplicación web
npm run build

# Sincronizar con Capacitor
npm run cap:sync

# Abrir en Xcode
npm run cap:open:ios
```

### 2. Configurar en Xcode

1. **Bundle Identifier**: `com.rentaflux.app`
2. **Display Name**: `RentaFlux`
3. **Version**: `1.0.0`
4. **Build**: `1`

### 3. Configurar Signing & Capabilities

1. **Team**: Seleccionar tu Apple Developer Team
2. **Signing Certificate**: Automático (recomendado)
3. **Provisioning Profile**: Automático

### 4. Configurar App Store Connect

1. Ir a: https://appstoreconnect.apple.com
2. **Crear Nueva App**:
   - Nombre: RentaFlux
   - Bundle ID: com.rentaflux.app
   - SKU: rentaflux-ios
   - Idioma principal: Español

### 5. Información de la App

**Información General:**
- Nombre: RentaFlux
- Subtítulo: Gestión Inmobiliaria Integral
- Categoría: Business
- Subcategoría: Productivity

**Descripción:**
```
RentaFlux es la solución completa para la gestión de propiedades de alquiler. 

CARACTERÍSTICAS PRINCIPALES:
• Gestión de inquilinos y contratos
• Seguimiento de pagos automático
• Sistema de mantenimiento integrado
• Contabilidad y reportes financieros
• Invitaciones digitales para inquilinos
• Asistente IA para consultas

BENEFICIOS:
✓ Ahorra tiempo en gestión administrativa
✓ Mejora la comunicación con inquilinos
✓ Centraliza toda la información
✓ Genera reportes automáticos
✓ Acceso desde cualquier dispositivo

Perfecto para propietarios individuales y empresas inmobiliarias que buscan digitalizar y optimizar sus procesos de alquiler.
```

### 6. Screenshots y Assets

**Subir screenshots para:**
- iPhone 15 Pro Max (6.7")
- iPhone 15 Pro (6.1") 
- iPad Pro (12.9")

**Iconos:**
- App Icon: 1024x1024px

### 7. Información de Revisión

**Notas para Revisión:**
```
RentaFlux es una aplicación de gestión inmobiliaria que permite:

1. Gestionar propiedades de alquiler
2. Administrar inquilinos y pagos
3. Solicitar y dar seguimiento a mantenimiento
4. Generar reportes financieros

Cuenta de prueba:
Email: demo@rentaflux.com
Password: Demo123!

La app requiere registro para acceder a las funcionalidades.
```

### 8. Envío para Revisión

1. **Construir Archive**:
   - Product → Archive en Xcode
   - Validar el archive
   - Distribuir a App Store

2. **Configurar Release**:
   - Versión: Manual
   - Fecha de lanzamiento: Después de aprobación

3. **Enviar para Revisión**:
   - Completar toda la información
   - Aceptar términos y condiciones
   - Enviar

## Tiempos Estimados

- **Revisión inicial**: 24-48 horas
- **Revisión completa**: 2-7 días
- **Aprobación**: Inmediata tras revisión exitosa

## Checklist Final

- [ ] Bundle ID configurado correctamente
- [ ] Certificados de firma válidos
- [ ] Screenshots subidos para todos los tamaños
- [ ] Descripción completa y precisa
- [ ] Política de privacidad configurada
- [ ] Información de contacto actualizada
- [ ] Cuenta de prueba proporcionada
- [ ] Archive construido y validado
- [ ] Enviado para revisión