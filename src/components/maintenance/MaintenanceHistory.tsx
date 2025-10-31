import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Search, FileText, Clock, CheckCircle, User, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

interface MaintenanceHistoryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  unit_number: string;
  assigned_to: string | null;
  provider_name?: string;
  created_at: string;
  completed_at: string | null;
  tenant_name?: string;
  property_name?: string;
}

interface MaintenanceHistoryProps {
  propertyId?: string;
  unitNumber?: string;
}

export function MaintenanceHistory({ propertyId, unitNumber }: MaintenanceHistoryProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: historyItems = [], isLoading } = useQuery({
    queryKey: ["maintenance-history", user?.id, propertyId, unitNumber],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_requests')
        .select(`
          id,
          title,
          description,
          category,
          priority,
          status,
          unit_number,
          assigned_to,
          created_at,
          completed_at,
          tenants (
            name,
            properties (
              name
            )
          ),
          maintenance_providers (
            name
          )
        `)
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });

      // Filter by property if specified
      if (propertyId) {
        query = query.eq('tenants.property_id', propertyId);
      }

      // Filter by unit if specified
      if (unitNumber) {
        query = query.eq('unit_number', unitNumber);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category || 'other',
        priority: item.priority,
        status: item.status,
        unit_number: item.unit_number,
        assigned_to: item.assigned_to,
        provider_name: item.maintenance_providers?.name,
        created_at: item.created_at,
        completed_at: item.completed_at,
        tenant_name: item.tenants?.name,
        property_name: item.tenants?.properties?.name
      })) as MaintenanceHistoryItem[] || [];
    },
    enabled: !!user
  });

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.unit_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      assigned: { label: "Asignado", variant: "default" as const, icon: User },
      in_progress: { label: "En Progreso", variant: "default" as const, icon: Wrench },
      completed: { label: "Completado", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Cancelado", variant: "destructive" as const, icon: FileText }
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-2 text-muted-foreground">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, descripción o unidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="assigned">Asignado</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="plumbing">Plomería</SelectItem>
            <SelectItem value="electrical">Eléctrico</SelectItem>
            <SelectItem value="heating">Calefacción/Aire</SelectItem>
            <SelectItem value="appliance">Electrodomésticos</SelectItem>
            <SelectItem value="structural">Estructural</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No se encontraron registros</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "No hay historial de mantenimiento disponible"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>Unidad {item.unit_number}</span>
                      {item.property_name && (
                        <>
                          <span>•</span>
                          <span>{item.property_name}</span>
                        </>
                      )}
                      {item.tenant_name && (
                        <>
                          <span>•</span>
                          <span>{item.tenant_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(item.status)}
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{item.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Creado:</span>
                      <span>{format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                    </div>
                    {item.completed_at && (
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Completado:</span>
                        <span>{format(new Date(item.completed_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Categoría:</span>
                      <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
                    </div>
                    {item.provider_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Proveedor:</span>
                        <span>{item.provider_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
