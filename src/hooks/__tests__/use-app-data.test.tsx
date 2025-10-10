import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppData } from '../use-app-data';
import { mockSupabaseClient } from '../test/mocks/supabase';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    userRole: 'landlord_premium'
  })
}));

describe('useAppData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should return loading state initially', () => {
    // Mock pending promises
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
        })
      })
    });

    const { result } = renderHook(() => useAppData(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toEqual({
      totalProperties: 0,
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
      monthlyRevenue: 0,
      activeTenants: 0,
      occupancyRate: 0,
      collectionRate: 0,
      totalTenants: 0,
      overduePayments: 0,
      pendingDeposits: 0,
      upcomingMoveIns: 0,
      upcomingMoveOuts: 0
    });
  });

  it('should fetch and calculate stats correctly', async () => {
    const mockTenants = [
      {
        id: '1',
        name: 'John Doe',
        status: 'active',
        rent_amount: 1000,
        moveInDate: '2024-01-01',
        leaseEndDate: '2024-12-31'
      },
      {
        id: '2',
        name: 'Jane Smith',
        status: 'active',
        rent_amount: 1200,
        moveInDate: '2024-02-01',
        leaseEndDate: '2025-01-31'
      }
    ];

    const mockProperties = [
      { id: '1', name: 'Property 1', total_units: 3 },
      { id: '2', name: 'Property 2', total_units: 2 }
    ];

    const mockUnits = [
      { id: '1', property_id: '1', is_available: false, rent_amount: 1000 },
      { id: '2', property_id: '1', is_available: false, rent_amount: 1200 },
      { id: '3', property_id: '1', is_available: true, rent_amount: 1100 },
      { id: '4', property_id: '2', is_available: true, rent_amount: 1300 },
      { id: '5', property_id: '2', is_available: true, rent_amount: 1400 }
    ];

    const mockPayments = [
      { id: '1', tenant_id: '1', amount: 1000, payment_date: '2024-01-01' },
      { id: '2', tenant_id: '2', amount: 1200, payment_date: '2024-02-01' }
    ];

    // Mock the Promise.all call
    mockSupabaseClient.from.mockImplementation((table: string) => {
      const mockData = {
        tenants: mockTenants,
        properties: mockProperties,
        units: mockUnits,
        payments: mockPayments
      };

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockData[table as keyof typeof mockData],
            error: null
          })
        })
      };
    });

    const { result } = renderHook(() => useAppData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      totalProperties: 2,
      totalUnits: 5,
      occupiedUnits: 2,
      vacantUnits: 3,
      monthlyRevenue: 2200, // 1000 + 1200 from occupied units
      activeTenants: 2,
      occupancyRate: 40, // 2/5 * 100
      collectionRate: 100, // Assuming all payments are current
      totalTenants: 2,
      overduePayments: 0,
      pendingDeposits: 0,
      upcomingMoveIns: 0,
      upcomingMoveOuts: 0
    });
  });

  it('should handle API errors gracefully', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })
    });

    const { result } = renderHook(() => useAppData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.stats).toEqual({
      totalProperties: 0,
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
      monthlyRevenue: 0,
      activeTenants: 0,
      occupancyRate: 0,
      collectionRate: 0,
      totalTenants: 0,
      overduePayments: 0,
      pendingDeposits: 0,
      upcomingMoveIns: 0,
      upcomingMoveOuts: 0
    });
  });

  it('should calculate occupancy rate correctly with no units', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      const mockData = {
        tenants: [],
        properties: [{ id: '1', name: 'Property 1', total_units: 0 }],
        units: [],
        payments: []
      };

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockData[table as keyof typeof mockData],
            error: null
          })
        })
      };
    });

    const { result } = renderHook(() => useAppData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.occupancyRate).toBe(0);
  });

  it('should calculate upcoming move-ins and move-outs', async () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const mockTenants = [
      {
        id: '1',
        name: 'John Doe',
        status: 'active',
        rent_amount: 1000,
        moveInDate: nextWeek.toISOString().split('T')[0], // Moving in next week
        leaseEndDate: '2025-12-31'
      },
      {
        id: '2',
        name: 'Jane Smith',
        status: 'active',
        rent_amount: 1200,
        moveInDate: '2024-01-01',
        leaseEndDate: nextMonth.toISOString().split('T')[0] // Moving out next month
      }
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      const mockData = {
        tenants: mockTenants,
        properties: [{ id: '1', name: 'Property 1', total_units: 2 }],
        units: [
          { id: '1', property_id: '1', is_available: false, rent_amount: 1000 },
          { id: '2', property_id: '1', is_available: false, rent_amount: 1200 }
        ],
        payments: []
      };

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockData[table as keyof typeof mockData],
            error: null
          })
        })
      };
    });

    const { result } = renderHook(() => useAppData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.upcomingMoveIns).toBe(1);
    expect(result.current.stats.upcomingMoveOuts).toBe(1);
  });

  it('should refetch data when refetch is called', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      data: [],
      error: null
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(mockFetch)
      })
    });

    const { result } = renderHook(() => useAppData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the mock call count
    mockFetch.mockClear();

    // Call refetch
    result.current.refetch();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('should handle empty data arrays correctly', async () => {
    mockSupabaseClient.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    }));

    const { result } = renderHook(() => useAppData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      totalProperties: 0,
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
      monthlyRevenue: 0,
      activeTenants: 0,
      occupancyRate: 0,
      collectionRate: 0,
      totalTenants: 0,
      overduePayments: 0,
      pendingDeposits: 0,
      upcomingMoveIns: 0,
      upcomingMoveOuts: 0
    });
  });
});