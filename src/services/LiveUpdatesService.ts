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
      // Removed console.log for security
      return;
    }

    try {
      // Removed console.log for security
      
      // Configurar Live Updates
      await this.configureService();
      
      // Verificar actualizaciones al iniciar (con delay para evitar conflictos)
      setTimeout(async () => {
        await this.checkForUpdates();
      }, 5000);
      
      // Configurar verificación periódica
      this.startPeriodicCheck();
      
      // Removed console.log for security
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
      // Removed console.log for security
    } catch (error) {
      console.error('Live Updates: Error al configurar servicio:', error);
    }
  }

  /**
   * Verifica si hay actualizaciones disponibles
   */
  public async checkForUpdates(): Promise<boolean> {
    try {
      // Removed console.log for security
      
      const result: SyncResult = await sync();

      if (result.activeApplicationPathChanged) {
        // Removed console.log for security
        return true;
      } else {
        // Removed console.log for security
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
      // Removed console.log for security
      
      const result: SyncResult = await sync();

      if (result.activeApplicationPathChanged) {
        // Removed console.log for security
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

    // Removed console.log for security
  }

  /**
   * Detiene la verificación periódica
   */
  public stopPeriodicCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      // Removed console.log for security
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
