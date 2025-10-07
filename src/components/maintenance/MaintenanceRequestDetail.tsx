import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MessageSquare,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceRequest } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface MaintenanceRequestDetailProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

interface RequestDetail extends MaintenanceRequest {
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  property_name?: string;
  provider_name?: string;
  provider_email?: string;
  provider_phone?: string;
  assignment_notes?: string;
  scheduled_date?: string;
}

export function MaintenanceRequestDetail({ isOpen, onClose, requestId }: MaintenanceRequestDetailProps) {
  const [statusUpdate, setStatusUpdate] = useState("");
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ["maintenance-request-detail", requestId],
    queryFn: async (): Promise<RequestDetail | null> => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          tenants (
            name,
            email,
            phone,
            properties (
              name
            )
          ),
          maintenance_providers (
            name,
            email,
            phone
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        id: data.id,
        tenantId: data.tenant_id,
        unit: data.unit_number,
        title: data.title,
        description: data.description,
        category: data.category || 'other',
        priority: data.priority,
        status: data.status,
        assignedTo: data.assigned_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at,
        tenant_name: data.tenants?.name,
        tenant_email: data.tenants?.email,
        tenant_phone: data.tenants?.phone,
        property_name: data.tenants?.properties?.name,
        provider_name: data.maintenance_providers?.name,
        provider_email: data.maintenance_providers?.email,
        provider_phone: data.maintenance_providers?.phone,
        assignment_notes: data.assignment_notes,
        scheduled_date: data.scheduled_date
      };
    },
    enabled: isOpen && !!requestId
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // Add status update note if provided
      if (statusUpdate.trim()) {
        const { error: noteError } = await supabase
          .from('maintenance_notes')
          .insert({
            maintenance_request_id: requestId,
            note: statusUpdate,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (noteError) console.error('Error adding note:', noteError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-request-detail", requestId] });
      toast.success("Estado actualizado exitosamente");
      setStatusUpdate("");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar estado: " + error.message);
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      assigned: { label: "Asignado", variant: "default" as const, icon: User },
      in_progress: { label: "En Progreso", variant: "default" as const, icon: Clock },
      completed: { label: "Completado", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Cancelado", variant: "destructive" as const, icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      emergency: { label: "Emergencia", variant: "destructive" as const },
      high: { label: "Alta", variant: "destructive" as const },
      medium: { label: "Media", variant: "default" as const },
      low: { label: "Baja", variant: "secondary" as const }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      plumbing: "Plomería",
      electrical: "Eléctrico",
      heating: "Calefacción/Aire",
      appliance: "Electrodomésticos",
      structural: "Estructural",
      other: "Otro"
    };
    return categories[category] || category;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Solicitud de Mantenimiento</DialogTitle>
          <DialogDescription>
            Información completa y gestión de la solicitud
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Cargando detalles...</p>
          </div>
        ) : !request ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontró la solicitud</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Request Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{request.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Unidad {request.unit} • {request.property_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getPriorityBadge(request.priority)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{request.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="font-medium">Categoría:</span>
                    <Badge variant="outline" className="ml-2">
                      {getCategoryLabel(request.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Creado:</span>
                    <span>{format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tenant Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Inquilino
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Nombre:</span>
                    <p className="text-muted-foreground">{request.tenant_name || 'No disponible'}</p>
                  </div>
                  {request.tenant_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{request.tenant_email}</span>
                    </div>
                  )}
                  {request.tenant_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{request.tenant_phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Provider Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Proveedor Asignado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.provider_name ? (
                    <>
                      <div>
                        <span className="font-medium">Nombre:</span>
                        <p className="text-muted-foreground">{request.provider_name}</p>
                      </div>
                      {request.provider_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{request.provider_email}</span>
                        </div>
                      )}
                      {request.provider_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{request.provider_phone}</span>
                        </div>
                      )}
                      {request.scheduled_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Programado: {format(new Date(request.scheduled_date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                        </div>
                      )}
                      {request.assignment_notes && (
                        <div>
                          <span className="font-medium">Notas de asignación:</span>
                          <p className="text-muted-foreground text-sm mt-1">{request.assignment_notes}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No hay proveedor asignado</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status Update */}
            {request.status !== 'completed' && request.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Actualizar Estado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="statusUpdate">Nota de actualización (opcional)</Label>
                    <Textarea
                      id="statusUpdate"
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      placeholder="Agregar comentarios sobre el progreso..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <Button
                        onClick={() => updateStatusMutation.mutate('in_progress')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Marcar En Progreso
                      </Button>
                    )}
                    {(request.status === 'assigned' || request.status === 'in_progress') && (
                      <Button
                        onClick={() => updateStatusMutation.mutate('completed')}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Marcar Completado
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate('cancelled')}
                      disabled={updateStatusMutation.isPending}
                    >
                      Cancelar Solicitud
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completion Info */}
            {request.completedAt && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Completado el {format(new Date(request.completedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}