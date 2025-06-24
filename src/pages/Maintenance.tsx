
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaintenanceRequest } from "@/types";
import { Layout } from "@/components/Layout";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import { MaintenanceRequestForm } from "@/components/maintenance/MaintenanceRequestForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import DatabaseService from "@/services/DatabaseService";
import { toast } from "sonner";

const Maintenance = () => {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const dbService = DatabaseService.getInstance();
  
  // Get language preference
  const language = localStorage.getItem('app-language') || 'en';
  const isSpanish = language === 'es';
  
  const { data: maintenanceRequests, isLoading, error } = useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: () => dbService.getMaintenanceRequests(),
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MaintenanceRequest> }) =>
      dbService.updateMaintenanceRequest(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast.success(isSpanish ? "Solicitud actualizada exitosamente" : "Request updated successfully");
    },
    onError: (error: any) => {
      toast.error(isSpanish 
        ? "Error al actualizar: " + (error.message || "Error desconocido")
        : "Update error: " + (error.message || "Unknown error")
      );
    }
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteMaintenanceRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast.success(isSpanish ? "Solicitud eliminada exitosamente" : "Request deleted successfully");
    },
    onError: (error: any) => {
      toast.error(isSpanish 
        ? "Error al eliminar: " + (error.message || "Error desconocido")
        : "Delete error: " + (error.message || "Unknown error")
      );
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
    const confirmMessage = isSpanish 
      ? '¿Estás seguro de que quieres eliminar esta solicitud?'
      : 'Are you sure you want to delete this request?';
    
    if (window.confirm(confirmMessage)) {
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
            {isSpanish ? 'Solicitudes de Mantenimiento' : 'Maintenance Requests'}
          </h1>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            {isSpanish ? 'Nueva Solicitud' : 'New Request'}
          </Button>
        </div>
        
        {showForm ? (
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">
              {isSpanish ? 'Crear Solicitud de Mantenimiento' : 'Create Maintenance Request'}
            </h2>
            <MaintenanceRequestForm 
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">{isSpanish ? 'Todas' : 'All'}</TabsTrigger>
              <TabsTrigger value="pending">{isSpanish ? 'Pendientes' : 'Pending'}</TabsTrigger>
              <TabsTrigger value="in_progress">{isSpanish ? 'En Progreso' : 'In Progress'}</TabsTrigger>
              <TabsTrigger value="completed">{isSpanish ? 'Completadas' : 'Completed'}</TabsTrigger>
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
