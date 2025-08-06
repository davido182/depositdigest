import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, UserMinus, Trash2, Plus, Edit } from "lucide-react";
import { unitsService } from "@/services/UnitsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnitEditForm } from "./UnitEditForm";

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
  unit_number: string;
  status: string;
  rent_amount: number;
}

interface UnitManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onUnitsUpdated: () => void;
}

export function UnitManagementModal({
  isOpen,
  onClose,
  propertyId,
  onUnitsUpdated,
}: UnitManagementModalProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<TenantForUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assigningTenant, setAssigningTenant] = useState<Unit | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnitNumber, setNewUnitNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, propertyId]);

  const loadData = async () => {
    if (!propertyId) return;
    
    setIsLoading(true);
    try {
      // Load units for this property
      const unitsData = await unitsService.getUnits(propertyId);
      setUnits(unitsData);

      // Load available tenants (those without assigned units)
      const { data: tenantsData, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active')
        .is('property_id', null);

      if (error) {
        console.error('Error loading tenants:', error);
        toast.error("Error al cargar inquilinos");
        return;
      }

      const formattedTenants: TenantForUnit[] = (tenantsData || []).map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        unit_number: tenant.unit_number,
        status: tenant.status,
        rent_amount: tenant.rent_amount
      }));

      setTenants(formattedTenants);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!newUnitNumber.trim()) {
      toast.error("El número de unidad es requerido");
      return;
    }

    try {
      await unitsService.createUnit({
        property_id: propertyId,
        unit_number: newUnitNumber,
        is_available: true,
      });
      
      setNewUnitNumber("");
      await loadData();
      onUnitsUpdated();
      toast.success("Unidad creada correctamente");
    } catch (error) {
      console.error('Error creating unit:', error);
      toast.error("Error al crear unidad");
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta unidad?")) {
      return;
    }

    try {
      await unitsService.deleteUnit(unitId);
      await loadData();
      onUnitsUpdated();
      toast.success("Unidad eliminada correctamente");
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast.error("Error al eliminar unidad");
    }
  };

  const handleAssignTenant = async () => {
    if (!assigningTenant || !selectedTenantId || !rentAmount) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    try {
      await unitsService.assignTenant(
        assigningTenant.id,
        selectedTenantId,
        parseFloat(rentAmount)
      );
      
      setAssigningTenant(null);
      setSelectedTenantId("");
      setRentAmount("");
      await loadData();
      onUnitsUpdated();
      toast.success("Inquilino asignado correctamente");
    } catch (error) {
      console.error('Error assigning tenant:', error);
      toast.error("Error al asignar inquilino");
    }
  };

  const handleUnassignTenant = async (unit: Unit) => {
    if (!confirm(`¿Estás seguro de que quieres desasignar al inquilino de la unidad ${unit.unit_number}?`)) {
      return;
    }
    
    try {
      await unitsService.unassignTenant(unit.id);
      await loadData();
      onUnitsUpdated();
      toast.success("Inquilino desasignado correctamente");
    } catch (error) {
      console.error('Error unassigning tenant:', error);
      toast.error("Error al desasignar inquilino");
    }
  };

  const handleEditUnit = async (unit: Unit) => {
    try {
      await unitsService.updateUnit(unit.id, {
        unit_number: unit.unit_number,
        rent_amount: unit.rent_amount,
      });
      await loadData();
      onUnitsUpdated();
      toast.success("Unidad actualizada correctamente");
    } catch (error) {
      console.error('Error updating unit:', error);
      toast.error("Error al actualizar unidad");
    }
  };

  const getTenantName = (tenantId: string) => {
    // This would need to be implemented to get tenant names
    // For now, return the tenant ID
    return `Inquilino ${tenantId.slice(0, 8)}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión de Unidades</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Unit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crear Nueva Unidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="unitNumber">Número de Unidad</Label>
                  <Input
                    id="unitNumber"
                    value={newUnitNumber}
                    onChange={(e) => setNewUnitNumber(e.target.value)}
                    placeholder="Ej: 101, A, 1A"
                  />
                </div>
                <Button onClick={handleCreateUnit}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Unidad
                </Button>
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
                            onClick={() => handleUnassignTenant(unit)}
                          >
                            <UserMinus className="h-4 w-4" />
                            Desasignar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUnit(unit)}
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUnit(unit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
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
        <Dialog open={!!assigningTenant} onOpenChange={() => setAssigningTenant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Asignar Inquilino a Unidad {assigningTenant?.unit_number}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tenant">Seleccionar Inquilino</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un inquilino" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} - {tenant.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="rent">Renta Mensual</Label>
                <Input
                  id="rent"
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setAssigningTenant(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleAssignTenant}>
                  Asignar Inquilino
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <UnitEditForm
          unit={editingUnit}
          isOpen={!!editingUnit}
          onClose={() => setEditingUnit(null)}
          onSave={handleEditUnit}
        />
      </DialogContent>
    </Dialog>
  );
}