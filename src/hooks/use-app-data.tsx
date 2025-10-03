import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AppData {
  tenants: any[];
  payments: any[];
  properties: any[];
  units: any[];
  isLoading: boolean;
  error: string | null;
}

interface AggregatedStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRevenue: number;
  activeTenants: number;
  occupancyRate: number;
  collectionRate: number;
  // DashboardStats compatibility
  totalTenants: number;
  overduePayments: number;
  pendingDeposits: number;
  upcomingMoveIns: number;
  upcomingMoveOuts: number;
}

export function useAppData() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>({
    tenants: [],
    payments: [],
    properties: [],
    units: [],
    isLoading: true,
    error: null,
  });

  const [stats, setStats] = useState<AggregatedStats>({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    monthlyRevenue: 0,
    activeTenants: 0,
    occupancyRate: 0,
    collectionRate: 0,
    // DashboardStats compatibility
    totalTenants: 0,
    overduePayments: 0,
    pendingDeposits: 0,
    upcomingMoveIns: 0,
    upcomingMoveOuts: 0,
  });

  const fetchAllData = useCallback(async () => {
    if (!user) {
      setData({
        tenants: [],
        payments: [],
        properties: [],
        units: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      console.log('useAppData: Fetching all data for user:', user.id);

      // Fetch all data in parallel
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // 1-indexed for DB
      const [tenantsResult, paymentsResult, propertiesResult, unitsResult] = await Promise.all([
        supabase.from('tenants').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('units').select('*')
      ]);

      // Check for errors
      if (tenantsResult.error) throw tenantsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;
      if (propertiesResult.error) throw propertiesResult.error;
      if (unitsResult.error) throw unitsResult.error;

      const tenants = tenantsResult.data || [];
      const payments = paymentsResult.data || [];
      const properties = propertiesResult.data || [];
      const units = unitsResult.data || [];

      console.log('useAppData: Fetched data:', {
        tenantsCount: tenants.length,
        paymentsCount: payments.length,
        propertiesCount: properties.length,
        unitsCount: units.length
      });

      // Calculate aggregated stats with detailed logging
      const totalProperties = properties.length;
      const totalUnits = units.length;
      const occupiedUnits = units.filter(u => !u.is_available).length;
      const vacantUnits = totalUnits - occupiedUnits;
      const activeTenants = tenants.filter(t => t.status === 'active').length;
      
      console.log('useAppData: Units analysis:', {
        totalUnits,
        occupiedUnits: units.filter(u => !u.is_available).map(u => ({ id: u.id, unit_number: u.unit_number, rent_amount: u.rent_amount })),
        vacantUnits: units.filter(u => u.is_available).map(u => ({ id: u.id, unit_number: u.unit_number }))
      });
      
      // Calculate monthly revenue from occupied units
      const monthlyRevenue = units
        .filter(u => !u.is_available)
        .reduce((sum, unit) => sum + (unit.rent_amount || 0), 0);
      
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Calculate collection rate for current month (simplified)
      const activeTenantsList = tenants.filter(t => t.status === 'active');
      const currentMonthPayments = payments.filter(p => {
        try {
          const paymentDate = new Date(p.payment_date || p.created_at);
          return paymentDate.getMonth() + 1 === currentMonth && 
                 paymentDate.getFullYear() === currentYear &&
                 p.status === 'completed';
        } catch {
          return false;
        }
      });
      
      const paidTenantIds = new Set(currentMonthPayments.map(p => p.tenant_id));
      const collectionRate = activeTenantsList.length > 0 ? (paidTenantIds.size / activeTenantsList.length) * 100 : 0;

      // Simplified overdue calculation
      const overduePayments = Math.max(activeTenantsList.length - paidTenantIds.size, 0);
      const pendingDeposits = overduePayments;

      setData({
        tenants,
        payments,
        properties,
        units,
        isLoading: false,
        error: null,
      });

      console.log('useAppData: Final calculated stats:', {
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        monthlyRevenue,
        activeTenants: activeTenantsList.length,
        occupancyRate: occupancyRate.toFixed(2),
        collectionRate: collectionRate.toFixed(2),
        overduePayments,
        pendingDeposits
      });

      setStats({
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        monthlyRevenue,
        activeTenants: activeTenantsList.length,
        occupancyRate,
        collectionRate,
        // DashboardStats compatibility  
        totalTenants: activeTenantsList.length,
        overduePayments, // Based on tracking table for current month
        pendingDeposits, // Mirror tracking table pending count
        upcomingMoveIns: 0, // TODO
        upcomingMoveOuts: 0, // TODO
      });

    } catch (error) {
      console.error('Error fetching app data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar datos'
      }));
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    ...data,
    stats,
    refetch: fetchAllData,
  };
}