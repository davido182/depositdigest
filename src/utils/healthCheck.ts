// Health check y monitoring para RentaFlux
import { supabase } from '@/integrations/supabase/client';
import { config } from './config';
import { logger } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    api: boolean;
  };
  performance: {
    dbLatency?: number;
    apiLatency?: number;
  };
  errors: string[];
}

export class HealthChecker {
  private async checkDatabase(): Promise<{ success: boolean; latency?: number; error?: string }> {
    try {
      const start = performance.now();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const latency = performance.now() - start;
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, latency };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkAuth(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkStorage(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkAPI(): Promise<{ success: boolean; latency?: number; error?: string }> {
    try {
      const start = performance.now();
      
      // Hacer una llamada simple a la API
      const response = await fetch(`${config.supabase.url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': config.supabase.anonKey,
        },
      });
      
      const latency = performance.now() - start;
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      return { success: true, latency };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async performHealthCheck(): Promise<HealthStatus> {
    logger.debug('Performing health check...');
    
    const errors: string[] = [];
    const performance: HealthStatus['performance'] = {};
    
    // Ejecutar checks en paralelo
    const [dbResult, authResult, storageResult, apiResult] = await Promise.all([
      this.checkDatabase(),
      this.checkAuth(),
      this.checkStorage(),
      this.checkAPI(),
    ]);

    // Procesar resultados
    const checks = {
      database: dbResult.success,
      auth: authResult.success,
      storage: storageResult.success,
      api: apiResult.success,
    };

    // Recopilar errores
    if (!dbResult.success) errors.push(`Database: ${dbResult.error}`);
    if (!authResult.success) errors.push(`Auth: ${authResult.error}`);
    if (!storageResult.success) errors.push(`Storage: ${storageResult.error}`);
    if (!apiResult.success) errors.push(`API: ${apiResult.error}`);

    // Recopilar métricas de performance
    if (dbResult.latency) performance.dbLatency = dbResult.latency;
    if (apiResult.latency) performance.apiLatency = apiResult.latency;

    // Determinar estado general
    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.values(checks).length;
    
    let status: HealthStatus['status'];
    if (healthyCount === totalChecks) {
      status = 'healthy';
    } else if (healthyCount >= totalChecks / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: config.app.version,
      environment: config.app.environment,
      checks,
      performance,
      errors,
    };

    logger.info('Health check completed', { 
      status, 
      errors: errors.length,
      performance 
    });

    return healthStatus;
  }
}

// Instancia global
export const healthChecker = new HealthChecker();

// Hook para React
import React from 'react';

export const useHealthCheck = (intervalMs = 30000) => {
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    const performCheck = async () => {
      try {
        setIsLoading(true);
        const status = await healthChecker.performHealthCheck();
        setHealthStatus(status);
      } catch (error) {
        logger.error('Health check failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Check inicial
    performCheck();

    // Check periódico
    if (intervalMs > 0) {
      interval = setInterval(performCheck, intervalMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [intervalMs]);

  return { healthStatus, isLoading };
};

// Función para exponer endpoint de health
export const createHealthEndpoint = () => {
  return async (): Promise<Response> => {
    try {
      const health = await healthChecker.performHealthCheck();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 207 : 503;
      
      return new Response(JSON.stringify(health), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
};