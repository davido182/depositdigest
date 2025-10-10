import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockFrom = vi.fn();

  const mockQueryBuilder = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  };

  mockFrom.mockReturnValue(mockQueryBuilder);

  const mockAuth = {
    getUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  };

  const mockSupabaseClient = {
    from: mockFrom,
    auth: mockAuth,
  } as unknown as SupabaseClient;

  return {
    client: mockSupabaseClient,
    mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      auth: mockAuth,
    },
  };
};

// Mock authenticated user
export const mockAuthenticatedUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
};

// Mock tenant data
export const mockTenantData = {
  id: 'tenant-1',
  landlord_id: 'test-user-id',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  moveInDate: '2023-01-01',
  leaseEndDate: '2024-01-01',
  rent_amount: 1200,
  depositAmount: 2400,
  status: 'active',
  notes: 'Test tenant',
  property_id: 'property-1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  properties: {
    name: 'Test Property',
    address: '123 Test St',
  },
};

// Mock property data
export const mockPropertyData = {
  id: 'property-1',
  landlord_id: 'test-user-id',
  name: 'Test Property',
  address: '123 Test St',
  total_units: 5,
  description: 'Test property',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

// Mock unit data
export const mockUnitData = {
  id: 'unit-1',
  property_id: 'property-1',
  unit_number: '101',
  monthly_rent: 1000,
  is_available: true,
  tenant_id: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};