import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Phone, Mail, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MaintenanceRequest } from "@/types";
import { ProviderManagement } from "./ProviderManagement";

interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  description?: string;
}

interface AssignProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceRequest: MaintenanceRequest;
}

export function AssignProviderDialog({ isOpen, onClose, maintenanceRequest }: AssignProviderDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const queryClient = useQueryClient();

  const assignProviderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProvider) throw new Error("No provider selected");

      // Update maintenance request with provider assignment
      const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({
          assigned_to: selectedProvider.id,
          status: 'assigned',
          assignment_notes: notes,
          scheduled_date: scheduledDate || null
        })
        .eq('id', maintenanceRequest.id);

      if (updateError) throw updateError;

      // Create assignment record for tracking
      const { error: assignmentError } = await supabase
        .from('maintenance_assignments')
        .insert({
          maintenance_request_id: maintenanceRequest.id,
          provider_id: selectedProvider.id,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          notes: notes,
          scheduled_date: scheduledDate || null,
          status: 'assigned'
        });

      if (assignmentError) throw assignmentError;

      // Send notification email to provider (optional - would need email service)
      // This could be implemented with a serverless function or email service
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast.success(`Solicitud asignada a ${selectedProvider?.name} exitosamente`);
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Error al asignar proveedor: " + error.message);
    }
  });

  const resetForm = () => {
    setSelectedProvider(null);
    setNotes("");
    setScheduledDate("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAssign = () => {
    if (!selectedProvider) {
      toast.error("Por favor selecciona un proveedor");
      return;
    }
    assignProviderMutation.mutate();
  };

  const getSpecialtyLabel = (specialty: string) => {
    const labels: Record<string, string> = {
      plumbing: "Plomería",
      electrical: "Eléctrico",
      heating: "Calefacción/Aire",
      appliance: "Electrodomésticos",
      structural: "Estructural",
      painting: "Pintura",
      cleaning: "Limpieza",
      other: "Otro"
    };
    return labels[specialty] || specialty;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Proveedor</DialogTitle>
          <DialogDescription>
            Asigna un proveedor de mantenimiento para: {maintenanceRequest.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Detalles de la Solicitud</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Unidad:</span> {maintenanceRequest.unit}
                </div>
                <div>
                  <span className="font-medium">Categoría:</span> {maintenanceRequest.category}
                </div>
                <div>
                  <span className="font-medium">Prioridad:</span> 
                  <Badge variant="outline" className="ml-2">
                    {maintenanceRequest.priority === 'high' ? 'Alta' : 
                     maintenanceRequest.priority === 'medium' ? 'Media' : 
                     maintenanceRequest.priority === 'low' ? 'Baja' : 'Emergencia'}
                  </Badge>
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">Descripción:</span>
                <p className="text-muted-foreground mt-1">{maintenanceRequest.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Provider Selection */}
          <div>
            <h4 className="font-medium mb-4">Seleccionar Proveedor</h4>
            <ProviderManagement 
              onProviderSelect={setSelectedProvider}
              selectedProviderId={selectedProvider?.id}
            />
          </div>

          {/* Selected Provider Details */}
          {selectedProvider && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Proveedor Seleccionado
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedProvider.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedProvider.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedProvider.phone}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedProvider.specialties.map(specialty => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {getSpecialtyLabel(specialty)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment Details */}
          {selectedProvider && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="scheduledDate">Fecha Programada (opcional)</Label>
                <input
                  id="scheduledDate"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notas para el Proveedor (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones especiales, horarios preferidos, etc..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedProvider || assignProviderMutation.isPending}
            >
              {assignProviderMutation.isPending ? "Asignando..." : "Asignar Proveedor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}