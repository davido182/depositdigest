
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MaintenanceCategory, MaintenancePriority } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  unit: z.string().min(1, "Unit is required"),
  category: z.enum(["plumbing", "electrical", "heating", "appliance", "structural", "other"]),
  priority: z.enum(["emergency", "high", "medium", "low"]),
});

type FormValues = z.infer<typeof formSchema>;

interface MaintenanceRequestFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export function MaintenanceRequestForm({ onSubmit, onCancel }: MaintenanceRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<Array<{id: string, unit_number: string, property_name: string}>>([]);
  const { user } = useAuth();

  // Load available units on component mount
  useEffect(() => {
    const loadUnits = async () => {
      if (!user?.id) return;

      try {
        const { data: units, error } = await supabase
          .from('units')
          .select(`
            id,
            unit_number,
            properties!inner(name, landlord_id)
          `)
          .eq('properties.landlord_id', user.id);

        if (error) {
          console.error('Error loading units:', error);
          return;
        }

        const formattedUnits = (units || []).map(unit => ({
          id: unit.id,
          unit_number: unit.unit_number,
          property_name: unit.properties?.name || 'Sin nombre'
        }));

        setAvailableUnits(formattedUnits);
      } catch (error) {
        console.error('Error loading units:', error);
      }
    };

    loadUnits();
  }, [user?.id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      unit: "",
      category: "other",
      priority: "medium",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { useAuth } = await import("@/contexts/AuthContext");
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Get tenant info to link the request
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, landlord_id')
        .eq('email', user.email)
        .single();

      if (!tenant) {
        toast.error("Información del inquilino no encontrada");
        return;
      }

      // Create maintenance request
      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          user_id: user.id,
          tenant_id: tenant.id,
          landlord_id: tenant.landlord_id,
          title: values.title,
          description: values.description,
          unit_number: values.unit,
          priority: values.priority,
          status: 'open'
        });

      if (error) {
        console.error("Error creating maintenance request:", error);
        toast.error("Error al crear solicitud de mantenimiento");
        return;
      }
      
      toast.success("Solicitud de mantenimiento enviada exitosamente");
      onSubmit();
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      toast.error("Error al enviar solicitud de mantenimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título del Problema</FormLabel>
                <FormControl>
                  <Input placeholder="ej., Fuga en la ducha" {...field} />
                </FormControl>
                <FormDescription>
                  Descripción breve del problema de mantenimiento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableUnits.length > 0 ? (
                      availableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.unit_number}>
                          {unit.property_name} - Unidad {unit.unit_number}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-units" disabled>
                        No hay unidades disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona la unidad donde se encuentra el problema
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="plumbing">Plomería</SelectItem>
                    <SelectItem value="electrical">Eléctrico</SelectItem>
                    <SelectItem value="heating">Calefacción/Aire</SelectItem>
                    <SelectItem value="appliance">Electrodomésticos</SelectItem>
                    <SelectItem value="structural">Estructural</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Tipo de problema de mantenimiento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridad</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la prioridad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="emergency">Emergencia</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  ¿Qué tan urgente es este problema?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Detallada</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Por favor proporciona detalles sobre el problema..." 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Describe el problema en detalle para ayudar al personal de mantenimiento
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
