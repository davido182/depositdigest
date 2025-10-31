import { createClient } from '@supabase/supabase-js';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Test database configuration
const TEST_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const TEST_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';

export const testSupabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);

// Test user credentials
export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  id: 'test-user-id'
};

// Setup and teardown for integration tests
beforeAll(async () => {
  // Create test user if it doesn't exist
  try {
    const { data, error } = await testSupabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (error && !error.message.includes('already registered')) {
      throw error;
    }
    
    // Removed console.log for security
  } catch (error) {
    console.warn('Test user setup failed:', error);
  }
});

beforeEach(async () => {
  // Sign in test user before each test
  const { error } = await testSupabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (error) {
    console.warn('Test user sign-in failed:', error);
  }
});

afterAll(async () => {
  // Clean up test data
  await cleanupTestData();
  
  // Sign out
  await testSupabase.auth.signOut();
});

export async function cleanupTestData() {
  try {
    // Delete test data in correct order (respecting foreign key constraints)
    await testSupabase.from('payments').delete().ilike('notes', '%test%');
    await testSupabase.from('maintenance_requests').delete().ilike('title', '%test%');
    await testSupabase.from('tenants').delete().ilike('name', '%test%');
    await testSupabase.from('units').delete().ilike('unit_number', '%test%');
    await testSupabase.from('properties').delete().ilike('name', '%test%');
    
    // Removed console.log for security
  } catch (error) {
    console.warn('Test data cleanup failed:', error);
  }
}

export async function createTestProperty(data: Partial<any> = {}) {
  const propertyData = {
    name: `Test Property ${Date.now()}`,
    address: '123 Test Street',
    total_units: 2,
    description: 'Test property for integration tests',
    ...data
  };

  const { data: property, error } = await testSupabase
    .from('properties')
    .insert(propertyData)
    .select()
    .single();

  if (error) throw error;
  return property;
}

export async function createTestUnit(propertyId: string, data: Partial<any> = {}) {
  const unitData = {
    property_id: propertyId,
    unit_number: `Test-${Date.now()}`,
    monthly_rent: 1000,
    is_available: true,
    ...data
  };

  const { data: unit, error } = await testSupabase
    .from('units')
    .insert(unitData)
    .select()
    .single();

  if (error) throw error;
  return unit;
}

export async function createTestTenant(data: Partial<any> = {}) {
  const tenantData = {
    name: `Test Tenant ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    phone: '(555) 123-4567',
    moveInDate: '2024-01-01',
    leaseEndDate: '2024-12-31',
    rent_amount: 1000,
    depositAmount: 500,
    status: 'active',
    notes: 'Test tenant for integration tests',
    ...data
  };

  const { data: tenant, error } = await testSupabase
    .from('tenants')
    .insert(tenantData)
    .select()
    .single();

  if (error) throw error;
  return tenant;
}

export async function createTestPayment(tenantId: string, data: Partial<any> = {}) {
  const paymentData = {
    tenant_id: tenantId,
    amount: 1000,
    payment_date: '2024-01-01',
    payment_method: 'transfer',
    status: 'completed',
    notes: 'Test payment for integration tests',
    ...data
  };

  const { data: payment, error } = await testSupabase
    .from('payments')
    .insert(paymentData)
    .select()
    .single();

  if (error) throw error;
  return payment;
}

export async function createTestMaintenanceRequest(tenantId: string, data: Partial<any> = {}) {
  const maintenanceData = {
    tenant_id: tenantId,
    title: `Test Maintenance ${Date.now()}`,
    description: 'Test maintenance request for integration tests',
    unit_number: 'Test-101',
    priority: 'medium',
    status: 'pending',
    ...data
  };

  const { data: maintenance, error } = await testSupabase
    .from('maintenance_requests')
    .insert(maintenanceData)
    .select()
    .single();

  if (error) throw error;
  return maintenance;
}
