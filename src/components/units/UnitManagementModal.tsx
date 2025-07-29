
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building } from "lucide-react";
import { toast } from "sonner";
import { ValidationService } from "@/services/ValidationService";
import { Tenant } from "@/types";
import DatabaseService from "@/services/DatabaseService";

interface UnitManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUnitCount: number;
  onSave: (count: number) => void;
}

export function UnitManagementModal({
  isOpen,
  onClose,
  currentUnitCount,
  onSave,
}: UnitManagementModalProps) {
  const [unitCount, setUnitCount] = useState(currentUnitCount);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUnitCount(currentUnitCount);
      setError("");
      loadTenants();
    }
  }, [isOpen, currentUnitCount]);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const dbService = DatabaseService.getInstance();
      const loadedTenants = await dbService.getTenants();
      setTenants(loadedTenants);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnitCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setUnitCount(value);
    
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSave = () => {
    try {
      const validationService = ValidationService.getInstance();
      validationService.validateUnitCount(unitCount, tenants);
      
      onSave(unitCount);
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  const getOccupancyInfo = () => {
    const activeTenants = tenants.filter(t => t.status === 'active');
    const occupiedUnits = activeTenants.map(t => parseInt(t.unit)).filter(u => !isNaN(u));
    const highestOccupiedUnit = occupiedUnits.length > 0 ? Math.max(...occupiedUnits) : 0;
    
    return {
      activeCount: activeTenants.length,
      highestUnit: highestOccupiedUnit,
      occupiedUnits: occupiedUnits.sort((a, b) => a - b)
    };
  };

  const occupancyInfo = getOccupancyInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Gestionar Unidades de la Propiedad
          </DialogTitle>
          <DialogDescription>
            Configura el número total de unidades en tu propiedad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="unitCount">Total de Unidades</Label>
            <Input
              id="unitCount"
              type="number"
              min="0"
              max="100"
              value={unitCount}
              onChange={handleUnitCountChange}
              className={error ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          {!isLoading && (
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Ocupación Actual</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Inquilinos activos: {occupancyInfo.activeCount}</p>
                <p>• Unidad más alta ocupada: {occupancyInfo.highestUnit || 'Ninguna'}</p>
                {occupancyInfo.occupiedUnits.length > 0 && (
                  <p>• Unidades ocupadas: {occupancyInfo.occupiedUnits.join(', ')}</p>
                )}
              </div>
              {unitCount < occupancyInfo.highestUnit && (
                <div className="text-xs text-destructive mt-2">
                  ⚠️ No puedes reducir las unidades por debajo de {occupancyInfo.highestUnit} (unidad más alta ocupada)
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p><strong>Nota:</strong> No puedes reducir el número de unidades por debajo del número más alto de unidad ocupada.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
          >
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
