
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initErrorMonitoring } from '@/utils/errorMonitoring'
import { validateConfig, config, buildInfo } from '@/utils/config'

// Validar configuración antes de inicializar
try {
  validateConfig();
  // Removed console.log for security starting...`);
  
  // Inicializar monitoreo de errores
  initErrorMonitoring();
  
  // Log de configuración en desarrollo
  if (config.features.enableDebugMode) {
    console.log('🔧 Configuration:', {
      environment: config.app.environment,
      domain: config.app.domain,
      supabaseUrl: config.supabase.url,
      features: config.features,
    });
  }
  
} catch (error) {
  console.error('❌ Configuration error:', error);
  // Mostrar error de configuración al usuario
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem; border: 1px solid #ef4444; border-radius: 8px; background: #fef2f2;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
        <p style="color: #991b1b;">${error.message}</p>
        <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">
          Please check your environment variables and try again.
        </p>
      </div>
    </div>
  `;
  throw error;
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  const root = createRoot(rootElement);
  root.render(<App />);
}
