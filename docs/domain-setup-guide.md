# 🌐 Guía de Configuración de Dominio - RentaFlux

## 🎯 Objetivo
Conectar tu dominio `rentaflux.com` a tu entorno de desarrollo local para poder editar y ver cambios en tiempo real.

## 🚀 Opción 1: Túnel de Desarrollo (Recomendado)

### Usando ngrok (Gratis)

1. **Instalar ngrok:**
   ```bash
   # Opción 1: Descargar desde https://ngrok.com/download
   # Opción 2: Con chocolatey
   choco install ngrok
   # Opción 3: Con scoop
   scoop install ngrok
   ```

2. **Crear cuenta gratuita:**
   - Ve a https://ngrok.com/signup
   - Crea una cuenta gratuita
   - Copia tu authtoken

3. **Configurar authtoken:**
   ```bash
   ngrok authtoken tu_authtoken_aqui
   ```

4. **Iniciar túnel:**
   ```bash
   # Asegúrate de que tu servidor esté corriendo (npm run dev)
   ngrok http 8080
   ```

5. **Configurar dominio personalizado:**
   - En tu panel de DNS, crea un CNAME:
   ```
   Tipo: CNAME
   Nombre: @ (o www)
   Valor: tu-url-ngrok.ngrok.io
   ```

### Usando Cloudflare Tunnel (Gratis)

1. **Instalar cloudflared:**
   ```bash
   # Descargar desde https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **Configurar túnel:**
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```

3. **Dominio personalizado:**
   - Configura tu dominio en Cloudflare
   - Usa Cloudflare Tunnel para conectar

## 🏗️ Opción 2: Servidor Web Local (Avanzado)

### Usando Nginx

1. **Instalar Nginx:**
   ```bash
   # Windows: Descargar desde http://nginx.org/en/download.html
   # O usar chocolatey: choco install nginx
   ```

2. **Configurar nginx.conf:**
   ```nginx
   server {
       listen 80;
       server_name rentaflux.com www.rentaflux.com;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Configurar SSL con Let's Encrypt:**
   ```bash
   # Instalar certbot
   # Generar certificado SSL
   certbot --nginx -d rentaflux.com -d www.rentaflux.com
   ```

### Usando Caddy (Más fácil)

1. **Instalar Caddy:**
   ```bash
   # Descargar desde https://caddyserver.com/download
   ```

2. **Crear Caddyfile:**
   ```
   rentaflux.com, www.rentaflux.com {
       reverse_proxy localhost:8080
   }
   ```

3. **Ejecutar Caddy:**
   ```bash
   caddy run
   ```

## 🌍 Configuración DNS

### En tu Proveedor de Dominio:

1. **Registro A (IP fija):**
   ```
   Tipo: A
   Nombre: @
   Valor: tu.ip.publica.aqui
   TTL: 300
   ```

2. **Registro CNAME (túnel):**
   ```
   Tipo: CNAME
   Nombre: @
   Valor: tu-tunel.ngrok.io
   TTL: 300
   ```

3. **Registro CNAME para www:**
   ```
   Tipo: CNAME
   Nombre: www
   Valor: rentaflux.com
   TTL: 300
   ```

## 🔧 Configuración de Desarrollo

### Actualizar Variables de Entorno

En tu `.env.local`:
```env
VITE_APP_DOMAIN=https://rentaflux.com
```

### Configurar Capacitor para Dominio

En `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.rentaflux.app',
  appName: 'RentaFlux',
  webDir: 'dist',
  server: {
    url: 'https://rentaflux.com',
    cleartext: false
  },
  // ... resto de configuración
};
```

## 🧪 Testing de Configuración

### Verificar que Todo Funciona:

1. **Servidor local corriendo:**
   ```bash
   npm run dev
   # Debería mostrar: Local: http://localhost:8080/
   ```

2. **Túnel funcionando:**
   ```bash
   curl -I https://tu-tunel.ngrok.io
   # Debería devolver 200 OK
   ```

3. **Dominio resolviendo:**
   ```bash
   nslookup rentaflux.com
   # Debería mostrar la IP correcta
   ```

4. **HTTPS funcionando:**
   ```bash
   curl -I https://rentaflux.com
   # Debería devolver 200 OK con certificado válido
   ```

## 🚀 Flujo de Desarrollo

### Desarrollo en Tiempo Real:

1. **Iniciar servidor local:**
   ```bash
   npm run dev
   ```

2. **Iniciar túnel:**
   ```bash
   ngrok http 8080
   ```

3. **Desarrollar:**
   - Edita archivos en tu IDE
   - Los cambios se reflejan automáticamente
   - Accede desde https://rentaflux.com
   - Prueba en dispositivos móviles

### Hot Reload Funcionando:

- ✅ Cambios en código → Recarga automática
- ✅ Cambios en estilos → Actualización instantánea
- ✅ Cambios en componentes → Recarga de componente
- ✅ Acceso desde cualquier dispositivo

## 🔒 Consideraciones de Seguridad

### Para Desarrollo:
- ✅ Usar túneles temporales
- ✅ No exponer datos sensibles
- ✅ Usar claves de prueba (Stripe, etc.)

### Para Producción:
- ✅ Certificados SSL válidos
- ✅ Configuración de firewall
- ✅ Variables de entorno seguras
- ✅ Backup y monitoreo

## 🛠️ Troubleshooting

### Problemas Comunes:

1. **Dominio no resuelve:**
   - Verificar configuración DNS
   - Esperar propagación (hasta 48h)
   - Usar herramientas como dig o nslookup

2. **Certificado SSL inválido:**
   - Regenerar certificado
   - Verificar configuración de dominio
   - Usar Let's Encrypt

3. **Túnel no funciona:**
   - Verificar que el servidor local esté corriendo
   - Revisar configuración de firewall
   - Probar con otro puerto

4. **Hot reload no funciona:**
   - Verificar configuración de proxy
   - Revisar headers de WebSocket
   - Probar con --host 0.0.0.0

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración DNS
3. Prueba con curl o herramientas de red
4. Consulta la documentación específica de tu proveedor

¡Tu dominio estará listo para desarrollo en tiempo real! 🎉