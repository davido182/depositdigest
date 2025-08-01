import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, UserPlus, UserMinus, Edit } from "lucide-react";
import { unitsService } from "@/services/UnitsService";
import { tenantService } from "@/services/TenantService";
import { Tenant as BaseTenant } from "@/types";
import { toast } from "sonner";

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  tenant_id?: string | null;
  rent_amount?: number | null;
  is_available: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TenantForUnit {
  id: string;
  name: string;
  email: string;
  rentAmount: number;
  unit: string;
  status: string;
}

interface UnitManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  onUnitsUpdated: () => void;
}

export function UnitManagementModal({ 
  isOpen, 
  onClose, 
  propertyId, 
  propertyName, 
  onUnitsUpdated 
}: UnitManagementModalProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<TenantForUnit[]>([]);
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [assigningTenant, setAssigningTenant] = useState<Unit | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, propertyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [unitsData, baseTenants] = await Promise.all([
        unitsService.getUnits(propertyId),
        tenantService.getTenants()
      ]);
      setUnits(unitsData);
      
      // Convert BaseTenant to TenantForUnit
      const convertedTenants: TenantForUnit[] = baseTenants
        .filter(t => t.status === 'active')
        .map(t => ({
          id: t.id,
          name: t.name,
          email: t.email,
          rentAmount: t.rentAmount,
          unit: t.unit,
          status: t.status
        }));
      setTenants(convertedTenants);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!newUnitNumber.trim()) {
      toast.error('Por favor ingresa un número de unidad');
      return;
    }

    try {
      await unitsService.createUnit({
        property_id: propertyId,
        unit_number: newUnitNumber,
        is_available: true
      });
      
      setNewUnitNumber("");
      loadData();
      onUnitsUpdated();
      toast.success('Unidad creada exitosamente');
    } catch (error) {
      console.error('Error creating unit:', error);
      toast.error('Error al crear unidad');
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta unidad?')) return;

    try {
      await unitsService.deleteUnit(unitId);
      loadData();
      onUnitsUpdated();
      toast.success('Unidad eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast.error('Error al eliminar unidad');
    }
  };

  const handleAssignTenant = async () => {
    if (!assigningTenant || !selectedTenantId || !rentAmount) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await unitsService.assignTenant(assigningTenant.id, selectedTenantId, rentAmount);
      setAssigningTenant(null);
      setSelectedTenantId("");
      setRentAmount(0);
      loadData();
      onUnitsUpdated();
      toast.success('Inquilino asignado exitosamente');
    } catch (error) {
      console.error('Error assigning tenant:', error);
      toast.error('Error al asignar inquilino');
    }
  };

  const handleUnassignTenant = async (unitId: string) => {
    if (!confirm('¿Estás seguro de que deseas desasignar este inquilino?')) return;

    try {
      await unitsService.unassignTenant(unitId);
      loadData();
      onUnitsUpdated();
      toast.success('Inquilino desasignado exitosamente');
    } catch (error) {
      console.error('Error unassigning tenant:', error);
      toast.error('Error al desasignar inquilino');
    }
  };

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return null;
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.name || 'Inquilino no encontrado';
  };

  const availableTenants = tenants.filter(tenant => 
    !units.some(unit => unit.tenant_id === tenant.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Unidades - {propertyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Unit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crear Nueva Unidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Número de unidad (ej: 101, A-1, etc.)"
                  value={newUnitNumber}
                  onChange={(e) => setNewUnitNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateUnit()}
                />
                <Button onClick={handleCreateUnit}>Crear Unidad</Button>
              </div>
            </CardContent>
          </Card>

          {/* Units List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unidades Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Cargando...</div>
              ) : units.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No hay unidades creadas para esta propiedad
                </div>
              ) : (
                <div className="grid gap-3">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">Unidad {unit.unit_number}</span>
                        {unit.is_available ? (
                          <Badge variant="secondary">Disponible</Badge>
                        ) : (
                          <Badge variant="default">Ocupada</Badge>
                        )}
                        {unit.tenant_id && (
                          <span className="text-sm text-muted-foreground">
                            {getTenantName(unit.tenant_id)}
                          </span>
                        )}
                        {unit.rent_amount && (
                          <span className="text-sm font-medium">
                            ${unit.rent_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {unit.is_available ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAssigningTenant(unit)}
                          >
                            <UserPlus className="h-4 w-4" />
                            Asignar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnassignTenant(unit.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                            Desasignar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUnit(unit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assign Tenant Dialog */}
        {assigningTenant && (
          <Dialog open={true} onOpenChange={() => setAssigningTenant(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Asignar Inquilino a Unidad {assigningTenant.unit_number}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Seleccionar Inquilino</Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un inquilino" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} - {tenant.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Monto de Renta</Label>
                  <Input
                    type="number"
                    placeholder="Ingresa el monto de renta"
                    value={rentAmount || ''}
                    onChange={(e) => setRentAmount(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssigningTenant(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleAssignTenant}>
                  Asignar Inquilino
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}