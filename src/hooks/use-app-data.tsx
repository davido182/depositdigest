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
      // Fetching all data for authenticated user

      // Fetch all data in parallel
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // 1-indexed for DB
      // Import tenant service at the top of the file
      const { tenantService } = await import('@/services/TenantService');
      
      const [tenantsData, paymentsResult, propertiesResult, unitsResult] = await Promise.all([
        tenantService.getTenants(),
        supabase.from('payments').select(`
          *,
          tenants!inner(landlord_id)
        `).eq('tenants.landlord_id', user.id),
        supabase.from('properties').select('*').eq('landlord_id', user.id),
        supabase.from('units').select(`
          *,
          properties!inner(landlord_id)
        `).eq('properties.landlord_id', user.id)
      ]);

      // Check for errors (tenantsData is already processed by service)
      if (paymentsResult.error) throw paymentsResult.error;
      if (propertiesResult.error) throw propertiesResult.error;
      if (unitsResult.error) throw unitsResult.error;

      const tenants = tenantsData || [];
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
      const activeTenants = tenants.filter(t => t.is_active).length;
      
      console.log('useAppData: Units analysis:', {
        totalUnits,
        occupiedUnits: units.filter(u => !u.is_available).map(u => ({ id: u.id, unit_number: u.unit_number, monthly_rent: u.monthly_rent })),
        vacantUnits: units.filter(u => u.is_available).map(u => ({ id: u.id, unit_number: u.unit_number }))
      });
      
      // Calculate monthly revenue from payment tracking table (like Analytics)
      const activeTenantsList = tenants.filter(t => t.status === 'active');
      const potentialMonthlyRevenue = units
        .filter(u => !u.is_available)
        .reduce((sum, unit) => sum + (unit.monthly_rent || 0), 0);
      
      // Get real revenue from payment tracking table
      const storageKey = `payment_records_${user.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(storageKey);
      let realMonthlyRevenue = 0;
      let collectionRate = 0;
      let overduePayments = 0;
      
      if (storedRecords && activeTenantsList.length > 0) {
        try {
          const records = JSON.parse(storedRecords);
          const currentMonthRecords = records.filter((r: any) => 
            r.year === currentYear && r.month === currentMonth && r.paid // month is 0-indexed in localStorage
          );
          
          // Calculate real revenue based on actual payments with real amounts
          realMonthlyRevenue = currentMonthRecords.reduce((total: number, record: any) => {
            // Use the stored amount if available, otherwise get tenant's rent
            if (record.amount) {
              return total + record.amount;
            } else {
              // Fallback: find tenant and use their rent amount
              const tenant = activeTenantsList.find(t => t.id === record.tenantId);
              return total + (tenant?.rent_amount || 0);
            }
          }, 0);
          
          // Calculate collection rate
          collectionRate = (currentMonthRecords.length / activeTenantsList.length) * 100;
          
          // Calculate overdue payments (only count active tenants who haven't paid)
          overduePayments = Math.max(0, activeTenantsList.length - currentMonthRecords.length);
        } catch (error) {
          console.error('Error parsing payment records:', error);
          realMonthlyRevenue = potentialMonthlyRevenue;
          collectionRate = 0;
          overduePayments = activeTenantsList.length;
        }
      } else {
        // Fallback to potential revenue if no tracking data
        realMonthlyRevenue = potentialMonthlyRevenue;
        collectionRate = 0;
        overduePayments = activeTenantsList.length;
      }
      
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      // Ensure pendingDeposits is never negative
      const pendingDeposits = Math.max(0, overduePayments);

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
        potentialMonthlyRevenue,
        realMonthlyRevenue,
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
        monthlyRevenue: realMonthlyRevenue,
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
