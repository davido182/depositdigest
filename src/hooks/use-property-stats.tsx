import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyStats {
  totalUnits: number;
  totalProperties: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRevenue: number;
  overduePayments: number;
  occupancyRate: number;
  totalTenants: number;
  pendingDeposits: number;
  upcomingMoveIns: number;
  upcomingMoveOuts: number;
  isLoading: boolean;
}

export function usePropertyStats() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<PropertyStats>({
    totalUnits: 0,
    totalProperties: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    monthlyRevenue: 0,
    overduePayments: 0,
    occupancyRate: 0,
    totalTenants: 0,
    pendingDeposits: 0,
    upcomingMoveIns: 0,
    upcomingMoveOuts: 0,
    isLoading: true,
  });

  const fetchStats = async () => {
    if (!user || !isAuthenticated) {
      console.log('No user or not authenticated, clearing stats');
      setStats({
        totalUnits: 0,
        totalProperties: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        monthlyRevenue: 0,
        overduePayments: 0,
        occupancyRate: 0,
        totalTenants: 0,
        pendingDeposits: 0,
        upcomingMoveIns: 0,
        upcomingMoveOuts: 0,
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
        .select('id, status, rent_amount, unit_number');

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
        .gte('payment_date', firstDayThisMonth.toISOString().split('T')[0]);

      if (paymentsError) {
        console.warn('Error fetching payments:', paymentsError);
        // Continue with 0 payments
      }

      console.log('Fetched payments count:', payments?.length || 0);

      // Para propiedades: contar edificios únicos
      const uniqueBuildings = new Set();
      const activeTenants = tenants?.filter(t => t.status === 'active') || [];
      
      activeTenants.forEach(tenant => {
        const building = tenant.unit_number?.substring(0, 1) || '1';
        uniqueBuildings.add(building);
      });
      
      const totalProperties = Math.max(uniqueBuildings.size, 1);
      const totalUnits = activeTenants.length + Math.floor(Math.random() * 5) + 1; // Mock units
      const occupiedUnits = activeTenants.length;
      const vacantUnits = totalUnits - occupiedUnits;
      const monthlyRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const overduePayments = 0;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

      const newStats = {
        totalUnits,
        totalProperties,
        occupiedUnits,
        vacantUnits,
        monthlyRevenue,
        overduePayments,
        occupancyRate,
        totalTenants: occupiedUnits,
        pendingDeposits: 0,
        upcomingMoveIns: 0,
        upcomingMoveOuts: 0,
        isLoading: false,
      };

      console.log('Calculated stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching property stats:', error);
      setStats({
        totalUnits: 0,
        totalProperties: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        monthlyRevenue: 0,
        overduePayments: 0,
        occupancyRate: 0,
        totalTenants: 0,
        pendingDeposits: 0,
        upcomingMoveIns: 0,
        upcomingMoveOuts: 0,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id, isAuthenticated]);

  return { stats, refetch: fetchStats };
}