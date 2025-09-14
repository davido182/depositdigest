# 🔒 Guía de Seguridad - RentaFlux

## ⚠️ REGLAS DE ORO DE SEGURIDAD

### ❌ NUNCA HAGAS ESTO:
1. **NO** pongas credenciales en archivos que se suben a GitHub
2. **NO** compartas claves secretas por email, chat o mensajes
3. **NO** uses claves de producción en desarrollo
4. **NO** hardcodees credenciales en el código fuente

### ✅ SIEMPRE HAZ ESTO:
1. **SÍ** usa archivos `.env.local` (están en .gitignore)
2. **SÍ** usa claves de prueba para desarrollo
3. **SÍ** usa variables de entorno del servidor para producción
4. **SÍ** revisa que .gitignore incluya archivos sensibles

## 🗂️ Tipos de Archivos y su Seguridad

### Archivos que SÍ se suben a GitHub:
- `.env.example` - Solo ejemplos, sin credenciales reales
- `README.md` - Documentación pública
- Código fuente - Sin credenciales hardcodeadas

### Archivos que NO se suben a GitHub:
- `.env.local` - Credenciales de desarrollo
- `.env.production` - Credenciales de producción
- `*.keystore` - Claves de firma móvil
- `*.p12` - Certificados

## 🔑 Tipos de Credenciales en RentaFlux

### 1. Supabase
```bash
# URL del proyecto (PÚBLICA - no es secreta)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave anónima (PÚBLICA - se puede ver en el navegador)
VITE_SUPABASE_ANON_KEY=eyJ...

# ⚠️ IMPORTANTE: Estas claves son PÚBLICAS
# La seguridad real está en las políticas RLS de Supabase
```

**¿Dónde obtenerlas?**
1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a Settings > API
4. Copia "Project URL" y "anon public"

### 2. Stripe
```bash
# Clave PÚBLICA de prueba (empieza con pk_test_)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ⚠️ IMPORTANTE: Usa SOLO claves de PRUEBA en desarrollo
```

**¿Dónde obtenerlas?**
1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com)
2. Asegúrate de estar en modo "Test"
3. Ve a Developers > API keys
4. Copia "Publishable key" (pk_test_...)

### 3. Claves que SÍ son secretas (NO van en .env.local):
- Stripe Secret Key (sk_...)
- Supabase Service Role Key
- Claves de APIs externas
- Passwords de bases de datos

## 🏗️ Configuración por Entornos

### Desarrollo Local (.env.local)
```bash
# Archivo: .env.local (NO se sube a GitHub)
VITE_SUPABASE_URL=https://tu-proyecto-dev.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_dev
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_prueba
```

### Staging (Variables del servidor)
- Se configuran en el servidor de staging
- NO se ponen en archivos del repositorio
- Usan base de datos de prueba

### Producción (Variables del servidor)
- Se configuran en el servidor de producción
- Usan claves reales de producción
- Base de datos real

## 🛡️ Mejores Prácticas

### Para Desarrollo:
1. **Copia el archivo ejemplo:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edita .env.local con tus credenciales:**
   ```bash
   # Usa tu editor favorito
   code .env.local
   # o
   notepad .env.local
   ```

3. **Verifica que no se suba a GitHub:**
   ```bash
   git status
   # .env.local NO debe aparecer en la lista
   ```

### Para Producción:
1. **Configura variables en el servidor:**
   - Heroku: Dashboard > Settings > Config Vars
   - Netlify: Site settings > Environment variables
   - Vercel: Project settings > Environment Variables

2. **Usa claves de producción:**
   - Stripe: Cambia a modo "Live"
   - Supabase: Proyecto de producción separado

### Para Móvil:
1. **Claves de firma:**
   - Genera keystores localmente
   - NO los subas a GitHub
   - Guárdalos en lugar seguro

2. **Certificados iOS:**
   - Descarga desde Apple Developer
   - Guarda en Keychain (Mac)
   - NO los incluyas en el repositorio

## 🚨 Qué Hacer si Expones una Clave

### Si subes una clave por error:

1. **Revoca la clave inmediatamente:**
   - Supabase: Regenera las claves del proyecto
   - Stripe: Desactiva la clave en el dashboard

2. **Limpia el historial de Git:**
   ```bash
   # Elimina el archivo del historial
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env.local' \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **Genera nuevas credenciales:**
   - Crea nuevas claves en los servicios
   - Actualiza tu .env.local
   - Actualiza variables del servidor

4. **Notifica al equipo:**
   - Informa sobre el incidente
   - Actualiza credenciales compartidas

## ✅ Checklist de Seguridad

Antes de cada commit:
- [ ] .env.local no está en `git status`
- [ ] No hay credenciales hardcodeadas en el código
- [ ] Solo uso claves de prueba en desarrollo
- [ ] .gitignore incluye archivos sensibles

Antes de deploy:
- [ ] Variables de entorno configuradas en el servidor
- [ ] Claves de producción separadas de desarrollo
- [ ] Accesos limitados por roles
- [ ] Backups de credenciales en lugar seguro

## 🆘 Contactos de Emergencia

Si hay un problema de seguridad:
1. Revoca credenciales inmediatamente
2. Cambia passwords relacionados
3. Revisa logs de acceso
4. Documenta el incidente

## 📚 Recursos Adicionales

- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Security](https://stripe.com/docs/security)
- [GitHub Security](https://docs.github.com/en/code-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)