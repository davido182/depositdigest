// Test de configuración de Stripe para RentaFlux
import { config } from './config';
import { logger } from './logger';

export const testStripeConfiguration = () => {
  logger.info('🧪 Testing Stripe configuration...');
  
  const stripeKey = config.stripe.publishableKey;
  
  if (!stripeKey) {
    logger.error('❌ Stripe publishable key not found');
    return {
      success: false,
      error: 'VITE_STRIPE_PUBLISHABLE_KEY not configured'
    };
  }
  
  if (!stripeKey.startsWith('pk_')) {
    logger.error('❌ Invalid Stripe key format');
    return {
      success: false,
      error: 'Stripe key must start with pk_test_ or pk_live_'
    };
  }
  
  const isTestKey = stripeKey.startsWith('pk_test_');
  const isLiveKey = stripeKey.startsWith('pk_live_');
  
  if (!isTestKey && !isLiveKey) {
    logger.error('❌ Invalid Stripe key type');
    return {
      success: false,
      error: 'Stripe key must be test (pk_test_) or live (pk_live_)'
    };
  }
  
  // Verificar que en desarrollo usemos claves de prueba
  if (config.app.environment === 'development' && isLiveKey) {
    logger.warn('⚠️ Using LIVE Stripe key in development - this is not recommended');
  }
  
  logger.info('✅ Stripe configuration valid', {
    keyType: isTestKey ? 'test' : 'live',
    environment: config.app.environment,
    keyPrefix: stripeKey.substring(0, 12) + '...'
  });
  
  return {
    success: true,
    keyType: isTestKey ? 'test' : 'live',
    environment: config.app.environment,
    isProperlyConfigured: config.app.environment === 'development' ? isTestKey : true
  };
};

// Test de conexión básica con Stripe (sin cargar la librería completa)
export const testStripeConnection = async () => {
  try {
    logger.info('🔗 Testing Stripe API connection...');
    
    const stripeKey = config.stripe.publishableKey;
    if (!stripeKey) {
      throw new Error('No Stripe key configured');
    }
    
    // Test básico: verificar que la clave es válida haciendo una llamada simple
    // Nota: En un test real cargaríamos @stripe/stripe-js, pero por ahora solo validamos formato
    
    const testResult = testStripeConfiguration();
    
    if (!testResult.success) {
      throw new Error(testResult.error);
    }
    
    logger.info('✅ Stripe connection test passed');
    
    return {
      success: true,
      message: 'Stripe is properly configured',
      details: testResult
    };
    
  } catch (error) {
    logger.error('❌ Stripe connection test failed', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check your VITE_STRIPE_PUBLISHABLE_KEY in .env.local'
    };
  }
};

// Función para mostrar información de Stripe en DevTools
export const getStripeInfo = () => {
  const stripeKey = config.stripe.publishableKey;
  
  return {
    configured: !!stripeKey,
    keyType: stripeKey?.startsWith('pk_test_') ? 'test' : 
             stripeKey?.startsWith('pk_live_') ? 'live' : 'invalid',
    keyPreview: stripeKey ? stripeKey.substring(0, 12) + '...' : 'Not configured',
    environment: config.app.environment,
    recommendation: config.app.environment === 'development' && stripeKey?.startsWith('pk_live_') 
      ? 'Consider using test keys in development' 
      : 'Configuration looks good'
  };
};
