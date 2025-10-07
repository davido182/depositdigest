import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Phone, Mail, Wrench, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  description?: string;
  rating?: number;
  created_at: string;
}

interface ProviderManagementProps {
  onProviderSelect?: (provider: Provider) => void;
  selectedProviderId?: string;
}

export function ProviderManagement({ onProviderSelect, selectedProviderId }: ProviderManagementProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: [] as string[],
    description: ""
  });

  const specialtyOptions = [
    "plumbing", "electrical", "heating", "appliance", "structural", "painting", "cleaning", "other"
  ];

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_providers')
        .select('*')
        .eq('landlord_id', user?.id)
        .order('name');

      if (error) throw error;
      return data as Provider[];
    },
    enabled: !!user
  });

  const createProviderMutation = useMutation({
    mutationFn: async (providerData: Omit<Provider, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('maintenance_providers')
        .insert({
          ...providerData,
          landlord_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Proveedor agregado exitosamente");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Error al agregar proveedor: " + error.message);
    }
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Provider> & { id: string }) => {
      const { data, error } = await supabase
        .from('maintenance_providers')
        .update(updates)
        .eq('id', id)
        .eq('landlord_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Proveedor actualizado exitosamente");
      resetForm();
      setEditingProvider(null);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Error al actualizar proveedor: " + error.message);
    }
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance_providers')
        .delete()
        .eq('id', id)
        .eq('landlord_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Proveedor eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar proveedor: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialties: [],
      description: ""
    });
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      email: provider.email,
      phone: provider.phone,
      specialties: provider.specialties,
      description: provider.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProvider) {
      updateProviderMutation.mutate({
        id: editingProvider.id,
        ...formData
      });
    } else {
      createProviderMutation.mutate(formData);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Proveedores de Mantenimiento</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingProvider(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}
              </DialogTitle>
              <DialogDescription>
                {editingProvider 
                  ? "Actualiza la información del proveedor"
                  : "Agrega un nuevo proveedor de servicios de mantenimiento"
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Especialidades</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {specialtyOptions.map(specialty => (
                    <Button
                      key={specialty}
                      type="button"
                      variant={formData.specialties.includes(specialty) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSpecialtyToggle(specialty)}
                      className="justify-start"
                    >
                      {getSpecialtyLabel(specialty)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Información adicional sobre el proveedor..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProviderMutation.isPending || updateProviderMutation.isPending}>
                  {editingProvider ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando proveedores...</div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay proveedores registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providers.map(provider => (
            <Card 
              key={provider.id} 
              className={`cursor-pointer transition-colors ${
                selectedProviderId === provider.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onProviderSelect?.(provider)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {provider.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {provider.phone}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(provider);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Estás seguro de eliminar este proveedor?')) {
                          deleteProviderMutation.mutate(provider.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-2">
                  {provider.specialties.map(specialty => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {getSpecialtyLabel(specialty)}
                    </Badge>
                  ))}
                </div>
                {provider.description && (
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}