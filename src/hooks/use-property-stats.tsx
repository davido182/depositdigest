import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyStats {
  totalProperties: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRevenue: number;
  overduePayments: number;
  occupancyRate: number;
  isLoading: boolean;
}

export function usePropertyStats() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    monthlyRevenue: 0,
    overduePayments: 0,
    occupancyRate: 0,
    isLoading: true,
  });

  const fetchStats = async () => {
    if (!user || !isAuthenticated) {
      console.log('No user or not authenticated, clearing stats');
      setStats({
        totalProperties: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        monthlyRevenue: 0,
        overduePayments: 0,
        occupancyRate: 0,
        isLoading: false,
      });
      return;
    }

    setStats(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('Fetching property stats for user:', user.id);

      // Obtener todos los tenants del usuario con optimización
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, status, rent_amount')
        .eq('user_id', user.id);

      if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
        throw tenantsError;
      }

      console.log('Fetched tenants count:', tenants?.length || 0);

      // Obtener pagos del último mes
      const currentDate = new Date();
      const firstDayThisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user.id)
        .gte('payment_date', firstDayThisMonth.toISOString().split('T')[0]);

      if (paymentsError) {
        console.warn('Error fetching payments:', paymentsError);
        // Continue with 0 payments
      }

      console.log('Fetched payments count:', payments?.length || 0);

      const totalProperties = tenants?.length || 0;
      const occupiedUnits = tenants?.filter(t => t.status === 'active').length || 0;
      const vacantUnits = totalProperties - occupiedUnits;
      const monthlyRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const overduePayments = 0; // Simplified for now
      const occupancyRate = totalProperties > 0 ? Math.round((occupiedUnits / totalProperties) * 100) : 0;

      const newStats = {
        totalProperties,
        occupiedUnits,
        vacantUnits,
        monthlyRevenue,
        overduePayments,
        occupancyRate,
        isLoading: false,
      };

      console.log('Calculated stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching property stats:', error);
      setStats({
        totalProperties: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        monthlyRevenue: 0,
        overduePayments: 0,
        occupancyRate: 0,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id, isAuthenticated]);

  return { stats, refetch: fetchStats };
}