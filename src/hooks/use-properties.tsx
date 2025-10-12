import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { propertyService } from "@/services/PropertyService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Property {
  id: string;
  name: string;
  address: string;
  units: number;
  occupied_units: number;
  monthly_revenue: number;
  created_at: string;
}

export function useProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProperties = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load properties from database
      const dbProperties = await propertyService.getProperties();
      
      // Get units for each property to calculate accurate occupancy and revenue
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*');

      if (unitsError) {
        console.error("Error loading units:", unitsError);
        toast.error("Error al cargar unidades");
        return;
      }

      // Map database properties to component format and calculate real occupancy and revenue
      const mappedProperties = dbProperties.map(dbProp => {
        const propertyUnits = units?.filter(unit => unit.property_id === dbProp.id) || [];
        const occupiedUnits = propertyUnits.filter(unit => !unit.is_available);
        const totalRevenue = occupiedUnits.reduce((sum, unit) => sum + (unit.monthly_rent || 0), 0);
        
        return {
          id: dbProp.id,
          name: dbProp.name,
          address: dbProp.address || '',
          units: propertyUnits.length,
          occupied_units: occupiedUnits.length,
          monthly_revenue: totalRevenue,
          created_at: dbProp.created_at
        };
      });

      setProperties(mappedProperties);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Error al cargar propiedades");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  const refetch = () => {
    loadProperties();
  };

  const totalProperties = properties.length;
  const totalUnits = properties.reduce((acc, prop) => acc + prop.units, 0);
  const occupiedUnits = properties.reduce((acc, prop) => acc + prop.occupied_units, 0);
  const monthlyRevenue = properties.reduce((acc, prop) => acc + prop.monthly_revenue, 0);

  return {
    properties,
    isLoading,
    refetch,
    totalProperties,
    totalUnits,
    occupiedUnits,
    monthlyRevenue
  };
}