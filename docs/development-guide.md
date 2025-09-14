# 🛠️ Guía de Desarrollo - RentaFlux

## Configuración Inicial

### Prerrequisitos
- Node.js 18 o superior
- npm 9 o superior
- Git
- Editor de código (VS Code recomendado)

### Setup del Proyecto
```bash
# Clonar el repositorio
git clone <tu-repo-url>
cd rentaflux

# Ejecutar script de configuración
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales
```

## Estructura del Proyecto

```
rentaflux/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── pages/              # Páginas de la aplicación
│   ├── hooks/              # Custom hooks
│   ├── services/           # Servicios de API
│   ├── utils/              # Utilidades y helpers
│   ├── integrations/       # Integraciones externas (Supabase)
│   └── types/              # Definiciones de tipos TypeScript
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migraciones de base de datos
├── docs/                   # Documentación
├── scripts/                # Scripts de automatización
└── mobile-assets/          # Assets para aplicaciones móviles
```

## Comandos de Desarrollo

### Desarrollo Local
```bash
npm run dev                 # Servidor de desarrollo
npm run dev:staging         # Desarrollo con config de staging
```

### Build y Testing
```bash
npm run build              # Build de producción
npm run build:staging      # Build de staging
npm run lint               # Linting
npm run lint:fix           # Corregir errores de linting
npm run type-check         # Verificación de tipos
```

### Móvil
```bash
npm run cap:add:android    # Agregar plataforma Android
npm run cap:add:ios        # Agregar plataforma iOS
npm run cap:sync           # Sincronizar assets
npm run build:mobile       # Build y sync para móvil
```

## Flujo de Trabajo

### Ramas
- `main`: Código de producción
- `develop`: Código de desarrollo
- `feature/*`: Nuevas características
- `hotfix/*`: Correcciones urgentes

### Proceso de Desarrollo
1. Crear rama desde `develop`
2. Desarrollar la funcionalidad
3. Ejecutar tests y linting
4. Crear Pull Request a `develop`
5. Review y merge
6. Deploy a staging para testing
7. Merge a `main` para producción

## Configuración de Entornos

### Variables de Entorno

#### Desarrollo (.env.local)
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_key
VITE_APP_DOMAIN=http://localhost:8080
NODE_ENV=development
```

#### Staging (.env.staging)
```env
VITE_SUPABASE_URL=staging_supabase_url
VITE_SUPABASE_ANON_KEY=staging_supabase_key
VITE_APP_DOMAIN=https://staging.rentaflux.com
NODE_ENV=staging
```

#### Producción (.env.production)
```env
VITE_SUPABASE_URL=production_supabase_url
VITE_SUPABASE_ANON_KEY=production_supabase_key
VITE_APP_DOMAIN=https://rentaflux.com
NODE_ENV=production
```

## Herramientas de Desarrollo

### DevTools Panel
En modo desarrollo, presiona:
- `Ctrl+Shift+D`: Toggle debug mode
- `Ctrl+Shift+L`: Exportar logs
- `Ctrl+Shift+S`: Seed test data
- `Ctrl+Shift+C`: Clear test data

### Logging
```typescript
import { logger } from '@/utils/logger';

logger.info('Información general');
logger.warn('Advertencia');
logger.error('Error', error);
logger.userAction('login', userId, { method: 'email' });
```

### Health Checks
```typescript
import { healthChecker } from '@/utils/healthCheck';

const health = await healthChecker.performHealthCheck();
console.log(health.status); // 'healthy' | 'degraded' | 'unhealthy'
```

## Convenciones de Código

### TypeScript
- Usar tipos explícitos
- Evitar `any`
- Usar interfaces para objetos complejos
- Documentar funciones públicas

### React
- Componentes funcionales con hooks
- Props tipadas con interfaces
- Usar custom hooks para lógica reutilizable
- Memoización cuando sea necesario

### Estilos
- Tailwind CSS para estilos
- Componentes de shadcn/ui
- Variables CSS para temas
- Responsive design first

### Naming
- Archivos: kebab-case
- Componentes: PascalCase
- Variables/funciones: camelCase
- Constantes: UPPER_SNAKE_CASE

## Testing

### Datos de Prueba
```typescript
import { testData } from '@/utils/testUtils';

// Usar datos de prueba predefinidos
const testUser = testData.landlord;
```

### Usuarios de Prueba
- Landlord: `landlord@rentaflux.com` / `Test123!`
- Tenant: `tenant@rentaflux.com` / `Test123!`

## Deployment

### Staging
```bash
npm run deploy:staging
```

### Producción
```bash
npm run deploy:production
```

### Manual
```bash
# Build
npm run build

# Deploy usando script
./scripts/deploy.sh production
```

## Troubleshooting

### Problemas Comunes

#### Error de configuración de Supabase
```bash
# Verificar variables de entorno
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

#### Problemas de build
```bash
# Limpiar cache
rm -rf node_modules dist
npm install
npm run build
```

#### Problemas de Capacitor
```bash
# Reinstalar plataformas
npx cap clean
npm run cap:sync
```

### Logs y Debugging
- Logs de desarrollo: DevTools Panel
- Logs de producción: Sentry (si configurado)
- Health checks: `/health` endpoint

## Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## Contacto

Para preguntas sobre desarrollo:
- Crear issue en GitHub
- Documentar problemas en el canal de desarrollo
- Revisar logs y health checks antes de reportar