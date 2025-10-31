import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Download, Smartphone, Wifi } from 'lucide-react';
import { useLiveUpdates } from '@/hooks/useLiveUpdates';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const LiveUpdatesStatus = () => {
  const {
    isChecking,
    hasUpdate,
    currentVersion,
    lastChecked,
    checkForUpdates,
    forceUpdate,
    isSupported,
  } = useLiveUpdates();

  const [isForcing, setIsForcing] = useState(false);

  const handleForceUpdate = async () => {
    setIsForcing(true);
    await forceUpdate();
    setIsForcing(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Smartphone className="h-4 w-4" />
          Actualizaciones Automáticas
        </CardTitle>
        <CardDescription className="text-xs">
          Estado del sistema Live Updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Estado:</span>
          <Badge variant={hasUpdate ? "destructive" : "secondary"} className="text-xs">
            {hasUpdate ? "Actualización disponible" : "Actualizado"}
          </Badge>
        </div>

        {currentVersion && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Versión:</span>
            <span className="text-xs font-mono">{currentVersion.slice(0, 8)}</span>
          </div>
        )}

        {lastChecked && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Última verificación:</span>
            <span className="text-xs">
              {formatDistanceToNow(lastChecked, { 
                addSuffix: true, 
                locale: es 
              })}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkForUpdates}
            disabled={isChecking}
            className="flex-1 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
            Verificar
          </Button>

          {hasUpdate && (
            <Button
              size="sm"
              onClick={handleForceUpdate}
              disabled={isForcing}
              className="flex-1 text-xs"
            >
              <Download className={`h-3 w-3 mr-1 ${isForcing ? 'animate-bounce' : ''}`} />
              Actualizar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
          <Wifi className="h-3 w-3" />
          <span>Verificación automática cada 30 min</span>
        </div>
      </CardContent>
    </Card>
  );
};
