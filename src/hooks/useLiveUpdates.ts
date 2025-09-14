import { useState, useEffect, useCallback } from 'react';
import { liveUpdatesService } from '@/services/LiveUpdatesService';
import { useDeviceFeatures } from './use-device-features';
import { toast } from 'sonner';

interface LiveUpdatesState {
  isChecking: boolean;
  hasUpdate: boolean;
  currentVersion: string | null;
  lastChecked: Date | null;
}

export const useLiveUpdates = () => {
  const { isNative } = useDeviceFeatures();
  const [state, setState] = useState<LiveUpdatesState>({
    isChecking: false,
    hasUpdate: false,
    currentVersion: null,
    lastChecked: null
  });

  // Verificar actualizaciones manualmente
  const checkForUpdates = useCallback(async () => {
    if (!isNative) return false;

    setState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const hasUpdate = await liveUpdatesService.checkForUpdates();
      const currentVersion = await liveUpdatesService.getCurrentVersion();
      
      setState(prev => ({
        ...prev,
        hasUpdate,
        currentVersion,
        lastChecked: new Date(),
        isChecking: false
      }));

      if (hasUpdate) {
        toast.success('Nueva actualización disponible', {
          description: 'La aplicación se actualizará automáticamente'
        });
      }

      return hasUpdate;
    } catch (error) {
      console.error('Error checking for updates:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      return false;
    }
  }, [isNative]);

  // Forzar actualización inmediata
  const forceUpdate = useCallback(async () => {
    if (!isNative) return false;

    try {
      toast.info('Aplicando actualización...', {
        description: 'La aplicación se reiniciará automáticamente'
      });

      const updated = await liveUpdatesService.forceUpdate();
      
      if (updated) {
        toast.success('Actualización aplicada correctamente');
      }

      return updated;
    } catch (error) {
      console.error('Error forcing update:', error);
      toast.error('Error al aplicar la actualización');
      return false;
    }
  }, [isNative]);

  // Obtener información de la configuración actual
  useEffect(() => {
    if (isNative) {
      liveUpdatesService.getCurrentConfig().then(config => {
        setState(prev => ({ 
          ...prev, 
          currentVersion: config?.appId || null 
        }));
      });
    }
  }, [isNative]);

  return {
    ...state,
    checkForUpdates,
    forceUpdate,
    isSupported: isNative
  };
};