import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Eye
} from "lucide-react";
import { DataConsistencyService, DataInconsistency } from "@/services/DataConsistencyService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function InconsistencyNotification() {
  const { user } = useAuth();
  const [inconsistencies, setInconsistencies] = useState<DataInconsistency[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkInconsistencies();
    }
  }, [user?.id]);

  const checkInconsistencies = async () => {
    if (!user?.id) return;

    try {
      const service = DataConsistencyService.getInstance();
      const found = await service.checkAllInconsistencies(user.id);
      setInconsistencies(found);
      
      // Auto-expand if there are high severity issues
      if (found.some(inc => inc.severity === 'high')) {
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('Error checking inconsistencies:', error);
    }
  };

  const handleAutoFix = async (inconsistency: DataInconsistency) => {
    if (!inconsistency.suggestedFix.autoFixable) return;

    setIsLoading(true);
    try {
      const service = DataConsistencyService.getInstance();
      const success = await service.autoFixInconsistency(inconsistency);
      
      if (success) {
        toast.success('Inconsistencia corregida automáticamente');
        // Remove from list
        setInconsistencies(prev => prev.filter(inc => inc.id !== inconsistency.id));
      } else {
        toast.error('No se pudo corregir automáticamente');
      }
    } catch (error) {
      toast.error('Error al corregir inconsistencia');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Desconocida';
    }
  };

  if (isDismissed || inconsistencies.length === 0) {
    return null;
  }

  const highSeverityCount = inconsistencies.filter(inc => inc.severity === 'high').length;
  const mediumSeverityCount = inconsistencies.filter(inc => inc.severity === 'medium').length;

  return (
    <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-800">
                Inconsistencias Detectadas
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {highSeverityCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {highSeverityCount} Alta
                </Badge>
              )}
              {mediumSeverityCount > 0 && (
                <Badge className="bg-yellow-500 text-white">
                  {mediumSeverityCount} Media
                </Badge>
              )}
              <Badge variant="outline" className="text-orange-700 border-orange-300">
                Total: {inconsistencies.length}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-orange-700 border-orange-300"
            >
              <Eye className="h-4 w-4 mr-1" />
              {isExpanded ? 'Ocultar' : 'Ver'}
              {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-orange-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {inconsistencies.slice(0, 5).map((inconsistency) => (
              <div
                key={inconsistency.id}
                className="bg-white p-3 rounded-lg border border-orange-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(inconsistency.severity)}`} />
                      <span className="font-medium text-sm">{inconsistency.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {getSeverityText(inconsistency.severity)}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      {inconsistency.description}
                    </p>
                    
                    <p className="text-xs text-orange-700 font-medium">
                      💡 {inconsistency.suggestedFix.description}
                    </p>
                  </div>

                  {inconsistency.suggestedFix.autoFixable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAutoFix(inconsistency)}
                      disabled={isLoading}
                      className="ml-2 text-green-700 border-green-300 hover:bg-green-50"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Auto-Fix
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {inconsistencies.length > 5 && (
              <div className="text-center">
                <p className="text-xs text-orange-600">
                  ... y {inconsistencies.length - 5} inconsistencias más
                </p>
              </div>
            )}

            <div className="bg-orange-100 p-3 rounded-lg">
              <p className="text-xs text-orange-700">
                <strong>💡 Recomendación:</strong> Resolver estas inconsistencias mejorará 
                la precisión de tus reportes y cálculos. Las marcadas con "Auto-Fix" 
                pueden corregirse automáticamente.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
