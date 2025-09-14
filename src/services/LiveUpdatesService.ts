import { sync, reload, getConfig, setConfig } from '@capacitor/live-updates';
import { Capacitor } from '@capacitor/core';
import type { SyncResult, LiveUpdateConfig } from '@capacitor/live-updates';

export class LiveUpdatesService {
  private static instance: LiveUpdatesService;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutos

  private constructor() {}

  public static getInstance(): LiveUpdatesService {
    if (!LiveUpdatesService.instance) {
      LiveUpdatesService.instance = new LiveUpdatesService();
    }
    return LiveUpdatesService.instance;
  }

  /**
   * Inicializa el servicio de Live Updates
   */
  public async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Live Updates: No disponible en web');
      return;
    }

    try {
      console.log('Live Updates: Inicializando servicio...');
      
      // Configurar Live Updates
      await this.configureService();
      
      // Verificar actualizaciones al iniciar (con delay para evitar conflictos)
      setTimeout(async () => {
        await this.checkForUpdates();
      }, 5000);
      
      // Configurar verificación periódica
      this.startPeriodicCheck();
      
      console.log('Live Updates: Servicio inicializado correctamente');
    } catch (error) {
      console.error('Live Updates: Error al inicializar:', error);
    }
  }

  /**
   * Configura el servicio de Live Updates
   */
  private async configureService(): Promise<void> {
    try {
      const config: LiveUpdateConfig = {
        appId: 'com.rentaflux.app',
        channel: 'production',
        autoUpdateMethod: 'background',
        maxVersions: 2,
        enabled: true
      };

      await setConfig(config);
      console.log('Live Updates: Configuración establecida');
    } catch (error) {
      console.error('Live Updates: Error al configurar servicio:', error);
    }
  }

  /**
   * Verifica si hay actualizaciones disponibles
   */
  public async checkForUpdates(): Promise<boolean> {
    try {
      console.log('Live Updates: Verificando actualizaciones...');
      
      const result: SyncResult = await sync();

      if (result.activeApplicationPathChanged) {
        console.log('Live Updates: Nueva actualización aplicada');
        return true;
      } else {
        console.log('Live Updates: No hay actualizaciones disponibles');
        return false;
      }
    } catch (error) {
      console.error('Live Updates: Error al verificar actualizaciones:', error);
      return false;
    }
  }

  /**
   * Fuerza una actualización inmediata
   */
  public async forceUpdate(): Promise<boolean> {
    try {
      console.log('Live Updates: Forzando actualización...');
      
      const result: SyncResult = await sync();

      if (result.activeApplicationPathChanged) {
        console.log('Live Updates: Actualización forzada aplicada');
        // Recargar la aplicación
        await reload();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Live Updates: Error al forzar actualización:', error);
      return false;
    }
  }

  /**
   * Obtiene información sobre la configuración actual
   */
  public async getCurrentConfig(): Promise<LiveUpdateConfig | null> {
    try {
      const config = await getConfig();
      return config;
    } catch (error) {
      console.error('Live Updates: Error al obtener configuración:', error);
      return null;
    }
  }

  /**
   * Inicia la verificación periódica de actualizaciones
   */
  private startPeriodicCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    this.updateCheckInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, this.CHECK_INTERVAL);

    console.log(`Live Updates: Verificación periódica configurada cada ${this.CHECK_INTERVAL / 60000} minutos`);
  }

  /**
   * Detiene la verificación periódica
   */
  public stopPeriodicCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      console.log('Live Updates: Verificación periódica detenida');
    }
  }

  /**
   * Limpia recursos del servicio
   */
  public cleanup(): void {
    this.stopPeriodicCheck();
  }
}

// Exportar instancia singleton
export const liveUpdatesService = LiveUpdatesService.getInstance();