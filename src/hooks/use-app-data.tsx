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
      const [tenantsResult, paymentsResult, propertiesResult, unitsResult] = await Promise.all([
        supabase.from('tenants').select('*').eq('user_id', user.id),
        supabase.from('payments').select('*').eq('user_id', user.id),
        supabase.from('properties').select('*').eq('user_id', user.id),
        supabase.from('units').select('*').eq('user_id', user.id)
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

      // Calculate collection rate for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const currentMonthPayments = payments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() + 1 === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               p.status === 'completed';
      });
      
      console.log('useAppData: Current month payments:', {
        currentMonth,
        currentYear,
        currentMonthPayments,
        activeTenants
      });
      
      const paidTenantIds = new Set(currentMonthPayments.map(p => p.tenant_id));
      const collectionRate = activeTenants > 0 ? (paidTenantIds.size / activeTenants) * 100 : 0;

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
        activeTenants,
        occupancyRate: occupancyRate.toFixed(2),
        collectionRate: collectionRate.toFixed(2)
      });

      setStats({
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        monthlyRevenue,
        activeTenants,
        occupancyRate,
        collectionRate,
        // DashboardStats compatibility
        totalTenants: activeTenants,
        overduePayments: 0, // TODO: Calculate from overdue payments
        pendingDeposits: 0, // TODO: Calculate from pending deposits
        upcomingMoveIns: 0, // TODO: Calculate from upcoming move-ins
        upcomingMoveOuts: 0, // TODO: Calculate from upcoming move-outs
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