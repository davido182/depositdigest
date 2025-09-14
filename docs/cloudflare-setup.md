# ☁️ Configuración de Cloudflare para RentaFlux

## 🎯 Objetivo
Configurar tu dominio `rentaflux.com` con Cloudflare Tunnel para que tus amigos puedan probar la aplicación en tiempo real.

## 🚀 Configuración Paso a Paso

### Paso 1: Configurar Dominio en Cloudflare

1. **Ir a Cloudflare Dashboard:**
   - Ve a https://dash.cloudflare.com/
   - Crea una cuenta gratuita si no tienes una

2. **Agregar tu Dominio:**
   - Click en "Add a Site"
   - Ingresa: `rentaflux.com`
   - Selecciona el plan "Free"

3. **Configurar DNS:**
   - Cloudflare detectará automáticamente tus registros DNS
   - Asegúrate de que estén todos los registros importantes
   - Click "Continue"

4. **Cambiar Nameservers:**
   - Cloudflare te dará 2 nameservers (ej: `ns1.cloudflare.com`, `ns2.cloudflare.com`)
   - Ve al panel de control de tu proveedor de dominio
   - Cambia los nameservers por los de Cloudflare
   - **Importante**: Este cambio puede tardar hasta 24 horas en propagarse

### Paso 2: Instalar Cloudflared

#### Opción A: Descarga Manual (Recomendada)
1. **Descargar:**
   - Ve a: https://github.com/cloudflare/cloudflared/releases/latest
   - Descarga: `cloudflared-windows-amd64.exe`
   - Renómbralo a: `cloudflared.exe`

2. **Instalar:**
   - Copia `cloudflared.exe` a `C:\Windows\System32\` (requiere permisos de admin)
   - O ponlo en la carpeta de tu proyecto

#### Opción B: Instalador Automático
```cmd
# Con winget (Windows 11)
winget install --id Cloudflare.cloudflared

# Con chocolatey
choco install cloudflared

# Con scoop
scoop install cloudflared
```

### Paso 3: Configurar Túnel

#### Método Rápido (Túnel Temporal)
```cmd
# Asegúrate de que tu servidor esté corriendo
npm run dev

# En otra terminal, ejecuta:
cloudflared tunnel --url http://localhost:8081
```

#### Método Permanente (Túnel Nombrado)

1. **Autenticarse:**
   ```cmd
   cloudflared tunnel login
   ```
   - Se abrirá tu navegador
   - Autoriza el acceso a tu cuenta de Cloudflare

2. **Crear Túnel:**
   ```cmd
   cloudflared tunnel create rentaflux
   ```

3. **Configurar DNS:**
   ```cmd
   cloudflared tunnel route dns rentaflux rentaflux.com
   ```

4. **Crear archivo de configuración:**
   Crear `config.yml` en `C:\Users\TuUsuario\.cloudflared\`:
   ```yaml
   tunnel: rentaflux
   credentials-file: C:\Users\TuUsuario\.cloudflared\tu-tunnel-id.json
   
   ingress:
     - hostname: rentaflux.com
       service: http://localhost:8081
     - hostname: www.rentaflux.com
       service: http://localhost:8081
     - service: http_status:404
   ```

5. **Ejecutar Túnel:**
   ```cmd
   cloudflared tunnel run rentaflux
   ```

## 🔧 Configuración para Desarrollo

### Actualizar Variables de Entorno

En tu `.env.local`:
```env
VITE_APP_DOMAIN=https://rentaflux.com
```

### Script de Inicio Automático

Crear `start-with-tunnel.bat`:
```batch
@echo off
echo 🚀 Iniciando RentaFlux con Cloudflare Tunnel...

start "RentaFlux Dev Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:8081"

echo.
echo ✅ RentaFlux está corriendo en:
echo 🌐 https://rentaflux.com
echo 🏠 http://localhost:8080
echo.
echo Comparte https://rentaflux.com con tus amigos para que prueben la app!
pause
```

## 🧪 Testing y Verificación

### Verificar que Todo Funciona

1. **Servidor Local:**
   ```cmd
   # Debería responder
   curl http://localhost:8081
   ```

2. **Túnel de Cloudflare:**
   ```cmd
   # Debería responder
   curl https://rentaflux.com
   ```

3. **Desde Dispositivos Móviles:**
   - Abre https://rentaflux.com en tu teléfono
   - Debería cargar la aplicación

### Herramientas de Diagnóstico

```cmd
# Ver estado del túnel
cloudflared tunnel info rentaflux

# Ver logs del túnel
cloudflared tunnel --loglevel debug --url http://localhost:8080

# Verificar DNS
nslookup rentaflux.com

# Test de conectividad
ping rentaflux.com
```

## 🔒 Configuración de Seguridad

### SSL/TLS Automático
- ✅ Cloudflare proporciona SSL automáticamente
- ✅ Certificado válido para rentaflux.com
- ✅ Redirección automática HTTP → HTTPS

### Configuración Recomendada en Cloudflare Dashboard

1. **SSL/TLS:**
   - Modo: "Full (strict)" o "Flexible"
   - Always Use HTTPS: ON
   - HTTP Strict Transport Security: ON

2. **Speed:**
   - Auto Minify: ON (HTML, CSS, JS)
   - Brotli: ON
   - Rocket Loader: ON

3. **Caching:**
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours

## 🚀 Compartir con Amigos

### Información para Compartir

```
🎉 ¡Prueba RentaFlux!

🌐 URL: https://rentaflux.com

📱 Funciona en:
✅ Computadoras (Chrome, Firefox, Safari, Edge)
✅ Teléfonos móviles (iOS, Android)
✅ Tablets

🔧 Características para probar:
• Registro de usuario
• Gestión de propiedades
• Sistema de pagos
• Panel de inquilinos
• Reportes y analytics

💡 Nota: Esta es una versión de desarrollo
Los cambios se reflejan en tiempo real.
```

### Monitoreo de Uso

En Cloudflare Dashboard puedes ver:
- Número de visitantes
- Países de origen
- Dispositivos utilizados
- Ancho de banda consumido

## 🛠️ Troubleshooting

### Problemas Comunes

1. **"This site can't be reached"**
   - Verificar que el servidor local esté corriendo
   - Verificar que cloudflared esté corriendo
   - Verificar configuración DNS

2. **"SSL handshake failed"**
   - Cambiar modo SSL en Cloudflare a "Flexible"
   - Esperar propagación DNS (hasta 24h)

3. **"Tunnel not found"**
   - Verificar que el túnel esté creado: `cloudflared tunnel list`
   - Recrear túnel si es necesario

4. **Cambios no se reflejan**
   - Verificar que el servidor local esté en modo desarrollo
   - Limpiar caché del navegador
   - Verificar configuración de caché en Cloudflare

### Logs y Debugging

```cmd
# Ver logs detallados del túnel
cloudflared tunnel --loglevel debug run rentaflux

# Ver logs del servidor de desarrollo
npm run dev

# Verificar conectividad
telnet rentaflux.com 443
```

## 📊 Métricas y Analytics

### En Cloudflare Dashboard:
- Requests por minuto
- Ancho de banda
- Países de visitantes
- Tipos de dispositivos

### En tu Aplicación:
- Usuarios registrados
- Funcionalidades más usadas
- Errores reportados

## 🎉 ¡Listo para Compartir!

Una vez configurado:

1. ✅ Tu aplicación estará disponible en https://rentaflux.com
2. ✅ SSL automático y seguro
3. ✅ Accesible desde cualquier dispositivo
4. ✅ Cambios en tiempo real
5. ✅ Analytics incluidos

¡Comparte la URL con tus amigos y recibe feedback valioso! 🚀