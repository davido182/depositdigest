// Configuración centralizada de RentaFlux
export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'RentaFlux',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    domain: import.meta.env.VITE_APP_DOMAIN || 'https://rentaflux.com',
    environment: import.meta.env.MODE || 'development',
  },
  
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  },
  
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
  },
  
  features: {
    enableAnalytics: import.meta.env.MODE === 'production',
    enableDebugMode: import.meta.env.MODE === 'development',
    enableSentry: !!import.meta.env.VITE_SENTRY_DSN,
  },
  
  api: {
    timeout: 30000,
    retries: 3,
  },
};

// Validación de configuración crítica
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!config.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!config.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
};

// Información del build
export const buildInfo = {
  version: __APP_VERSION__,
  mode: __BUILD_MODE__,
  timestamp: new Date().toISOString(),
};