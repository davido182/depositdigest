import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaintenanceRequest } from "@/types";
import { Layout } from "@/components/Layout";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import { MaintenanceRequestForm } from "@/components/maintenance/MaintenanceRequestForm";
import TenantMaintenanceList from "@/components/maintenance/TenantMaintenanceList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { DatabaseService } from "@/services/DatabaseService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Maintenance = () => {
  const { userRole } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const dbService = DatabaseService.getInstance();

  // Show tenant maintenance view for tenant users
  if (userRole === 'tenant') {
    return (
      <Layout>
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-semibold tracking-tight">Mantenimiento</h1>
          </div>
          <TenantMaintenanceList />
        </section>
      </Layout>
    );
  }
  
  const { data: maintenanceRequests, isLoading, error } = useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: () => dbService.getMaintenanceRequests(),
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MaintenanceRequest> }) =>
      dbService.updateMaintenanceRequest(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast.success("Solicitud actualizada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar: " + (error.message || "Error desconocido"));
    }
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteMaintenanceRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast.success("Solicitud eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar: " + (error.message || "Error desconocido"));
    }
  });

  const handleStatusChange = (id: string, newStatus: MaintenanceRequest['status']) => {
    updateMaintenanceMutation.mutate({ 
      id, 
      updates: { 
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
      }
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) {
      deleteMaintenanceMutation.mutate(id);
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Solicitudes de Mantenimiento
          </h1>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nueva Solicitud
          </Button>
        </div>
        
        {showForm ? (
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">
              Crear Solicitud de Mantenimiento
            </h2>
            <MaintenanceRequestForm 
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="in_progress">En Progreso</TabsTrigger>
              <TabsTrigger value="completed">Completadas</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <MaintenanceRequestList 
                requests={maintenanceRequests || []} 
                isLoading={isLoading}
                error={error ? String(error) : undefined}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </TabsContent>
            <TabsContent value="pending">
              <MaintenanceRequestList 
                requests={(maintenanceRequests || []).filter(r => r.status === 'pending')} 
                isLoading={isLoading}
                error={error ? String(error) : undefined}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </TabsContent>
            <TabsContent value="in_progress">
              <MaintenanceRequestList 
                requests={(maintenanceRequests || []).filter(r => r.status === 'in_progress' || r.status === 'assigned')} 
                isLoading={isLoading}
                error={error ? String(error) : undefined}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </TabsContent>
            <TabsContent value="completed">
              <MaintenanceRequestList 
                requests={(maintenanceRequests || []).filter(r => r.status === 'completed')} 
                isLoading={isLoading}
                error={error ? String(error) : undefined}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Maintenance;
