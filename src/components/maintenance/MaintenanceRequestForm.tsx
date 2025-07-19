
import { useState } from "react";
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
                <FormLabel>Issue Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Leaking Faucet" {...field} />
                </FormControl>
                <FormDescription>
                  Short description of the maintenance issue
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
                <FormLabel>Unit Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 101" {...field} />
                </FormControl>
                <FormDescription>
                  The unit where the issue is located
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
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="heating">Heating/Cooling</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Type of maintenance issue
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
                <FormLabel>Priority</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How urgent is this issue?
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
              <FormLabel>Detailed Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please provide details about the issue..." 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Describe the issue in detail to help maintenance staff understand the problem
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
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
