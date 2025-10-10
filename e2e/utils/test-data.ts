// Test data generators for E2E tests

export const generateTestTenant = () => ({
  name: `Test Tenant ${Date.now()}`,
  email: `test.tenant.${Date.now()}@example.com`,
  phone: '+1234567890',
  moveInDate: new Date().toISOString().split('T')[0],
  rentAmount: 1200,
  status: 'active' as const,
});

export const generateTestProperty = () => ({
  name: `Test Property ${Date.now()}`,
  address: `123 Test St, Test City, TC 12345`,
  totalUnits: 5,
  description: 'Test property for automated testing',
});

export const generateTestUnit = () => ({
  unitNumber: `Unit-${Date.now()}`,
  monthlyRent: 1000,
  isAvailable: true,
});

export const TEST_USER_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword123',
};

export const SELECTORS = {
  // Navigation
  sidebar: '[data-testid="sidebar"]',
  userMenu: '[data-testid="user-menu"]',
  
  // Forms
  tenantForm: '[data-testid="tenant-form"]',
  propertyForm: '[data-testid="property-form"]',
  unitForm: '[data-testid="unit-form"]',
  
  // Buttons
  saveButton: '[data-testid="save-button"]',
  cancelButton: '[data-testid="cancel-button"]',
  deleteButton: '[data-testid="delete-button"]',
  editButton: '[data-testid="edit-button"]',
  
  // Tables
  tenantsTable: '[data-testid="tenants-table"]',
  propertiesTable: '[data-testid="properties-table"]',
  
  // Inputs
  nameInput: '[data-testid="name-input"]',
  emailInput: '[data-testid="email-input"]',
  phoneInput: '[data-testid="phone-input"]',
  addressInput: '[data-testid="address-input"]',
  
  // Modals
  modal: '[data-testid="modal"]',
  confirmDialog: '[data-testid="confirm-dialog"]',
};