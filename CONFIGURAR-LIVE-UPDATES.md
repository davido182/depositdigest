# 🚀 CONFIGURACIÓN COMPLETA DE LIVE UPDATES

## 📋 PASO 1: CREAR CUENTA EN IONIC CLOUD

1. Ve a: https://ionic.io/
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto llamado "RentaFlux"
4. Anota tu **App ID** (debe ser: com.rentaflux.app)

## 🔑 PASO 2: INSTALAR IONIC CLI

```bash
npm install -g @ionic/cli
```

## 🔐 PASO 3: AUTENTICARSE

```bash
ionic login
```
Ingresa tus credenciales de Ionic Cloud

## ⚙️ PASO 4: CONFIGURAR EL PROYECTO

```bash
ionic link --app-id com.rentaflux.app
```

## 📱 PASO 5: CONFIGURAR LIVE UPDATES

```bash
ionic capacitor build android --live-update
```

## 🚀 PASO 6: DESPLEGAR PRIMERA ACTUALIZACIÓN

```bash
# Construir la app
npm run build

# Desplegar a Ionic Cloud
ionic deploy build --app-id com.rentaflux.app --channel production
```

## 🔄 PASO 7: CONFIGURAR ACTUALIZACIONES AUTOMÁTICAS

Ya está configurado en tu código, pero verifica que esté activo en:
- `src/services/LiveUpdatesService.ts`
- `capacitor.config.ts`

## ✅ PASO 8: PROBAR LIVE UPDATES

1. Instala el APK en tu teléfono
2. Haz un cambio en tu código
3. Ejecuta: `npm run build && ionic deploy build`
4. Abre la app en el teléfono
5. La actualización se descargará automáticamente

---

## 🚨 COMANDOS IMPORTANTES

### Desplegar actualización:
```bash
npm run build
ionic deploy build --app-id com.rentaflux.app --channel production
```

### Ver historial de despliegues:
```bash
ionic deploy list --app-id com.rentaflux.app
```

### Configurar diferentes canales:
```bash
# Para staging
ionic deploy build --app-id com.rentaflux.app --channel staging

# Para producción
ionic deploy build --app-id com.rentaflux.app --channel production
```

---

## 🎯 QUÉ HACER AHORA

1. **Crear cuenta en Ionic Cloud** (5 minutos)
2. **Instalar Ionic CLI** (2 minutos)  
3. **Autenticarse y vincular proyecto** (3 minutos)
4. **Desplegar primera actualización** (5 minutos)
5. **Probar en dispositivo** (10 minutos)

**Total: ~25 minutos para tener Live Updates funcionando**