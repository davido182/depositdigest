import { test, expect } from '@playwright/test';
import { AuthFixture } from '../fixtures/auth';
import { TestDataHelper } from '../utils/test-data';

test.describe('Tenant Management E2E Tests', () => {
  let auth: AuthFixture;
  let testData: TestDataHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthFixture(page);
    testData = new TestDataHelper();
    
    // Login before each test
    await auth.login();
    
    // Navigate to tenants page
    await page.goto('/tenants');
    await expect(page.getByText('Gestión de Inquilinos')).toBeVisible();
  });

  test.afterEach(async () => {
    // Clean up test data
    await testData.cleanup();
  });

  test.describe('Tenant Creation Workflow', () => {
    test('should create a new tenant successfully', async ({ page }) => {
      // Click "Add New Tenant" button
      await page.getByRole('button', { name: /agregar.*inquilino/i }).click();
      
      // Verify modal opens
      await expect(page.getByText('Agregar Nuevo Inquilino')).toBeVisible();

      // Fill out tenant form
      const tenantData = testData.generateTenantData();
      
      await page.getByLabel(/nombre/i).fill(tenantData.name);
      await page.getByLabel(/correo/i).fill(tenantData.email);
      await page.getByLabel(/teléfono/i).fill(tenantData.phone);
      await page.getByLabel(/fecha.*ingreso/i).fill(tenantData.moveInDate);
      await page.getByLabel(/monto.*renta/i).fill(tenantData.rentAmount.toString());

      // Submit form
      await page.getByRole('button', { name: /crear.*inquilino/i }).click();

      // Verify success message
      await expect(page.getByText(/inquilino.*creado.*correctamente/i)).toBeVisible();

      // Verify tenant appears in list
      await expect(page.getByText(tenantData.name)).toBeVisible();
      await expect(page.getByText(tenantData.email)).toBeVisible();
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      // Click "Add New Tenant" button
      await page.getByRole('button', { name: /agregar.*inquilino/i }).click();

      // Try to submit empty form
      await page.getByRole('button', { name: /crear.*inquilino/i }).click();

      // Verify validation errors
      await expect(page.getByText(/nombre.*requerido/i)).toBeVisible();
      
      // Fill invalid email
      await page.getByLabel(/nombre/i).fill('Test Tenant');
      await page.getByLabel(/correo/i).fill('invalid-email');
      await page.getByRole('button', { name: /crear.*inquilino/i }).click();

      // Verify email validation error
      await expect(page.getByText(/email.*inválido/i)).toBeVisible();
    });

    test('should create tenant with property and unit assignment', async ({ page }) => {
      // First create a test property with units
      const propertyData = await testData.createTestProperty();
      const unitData = await testData.createTestUnit(propertyData.id);

      // Click "Add New Tenant" button
      await page.getByRole('button', { name: /agregar.*inquilino/i }).click();

      // Fill basic tenant information
      const tenantData = testData.generateTenantData();
      await page.getByLabel(/nombre/i).fill(tenantData.name);
      await page.getByLabel(/correo/i).fill(tenantData.email);
      await page.getByLabel(/monto.*renta/i).fill(tenantData.rentAmount.toString());

      // Select property
      await page.getByRole('combobox', { name: /propiedad/i }).click();
      await page.getByText(propertyData.name).click();

      // Wait for units to load and select unit
      await expect(page.getByRole('combobox', { name: /unidad/i })).toBeEnabled();
      await page.getByRole('combobox', { name: /unidad/i }).click();
      await page.getByText(`Unidad ${unitData.unit_number}`).click();

      // Submit form
      await page.getByRole('button', { name: /crear.*inquilino/i }).click();

      // Verify success
      await expect(page.getByText(/inquilino.*creado.*correctamente/i)).toBeVisible();
      
      // Verify tenant appears with unit information
      await expect(page.getByText(tenantData.name)).toBeVisible();
      await expect(page.getByText(unitData.unit_number)).toBeVisible();
    });
  });

  test.describe('Tenant Editing Workflow', () => {
    test('should edit existing tenant successfully', async ({ page }) => {
      // Create a test tenant first
      const tenantData = await testData.createTestTenant();

      // Find and click edit button for the tenant
      const tenantRow = page.locator(`tr:has-text("${tenantData.name}")`);
      await tenantRow.getByRole('button', { name: /editar/i }).click();

      // Verify edit modal opens
      await expect(page.getByText('Editar Inquilino')).toBeVisible();

      // Verify form is pre-filled
      await expect(page.getByDisplayValue(tenantData.name)).toBeVisible();
      await expect(page.getByDisplayValue(tenantData.email)).toBeVisible();

      // Update tenant information
      const updatedName = `${tenantData.name} Updated`;
      await page.getByLabel(/nombre/i).clear();
      await page.getByLabel(/nombre/i).fill(updatedName);

      // Submit changes
      await page.getByRole('button', { name: /guardar.*cambios/i }).click();

      // Verify success message
      await expect(page.getByText(/inquilino.*actualizado.*correctamente/i)).toBeVisible();

      // Verify updated information appears in list
      await expect(page.getByText(updatedName)).toBeVisible();
    });

    test('should update tenant dates with correct format', async ({ page }) => {
      // Create a test tenant
      const tenantData = await testData.createTestTenant();

      // Edit tenant
      const tenantRow = page.locator(`tr:has-text("${tenantData.name}")`);
      await tenantRow.getByRole('button', { name: /editar/i }).click();

      // Update move-in date
      const newMoveInDate = '2024-06-15';
      await page.getByLabel(/fecha.*ingreso/i).fill(newMoveInDate);

      // Verify formatted date display appears
      await expect(page.getByText(/formato.*15\/6\/2024/i)).toBeVisible();

      // Update lease end date
      const newLeaseEndDate = '2025-06-15';
      await page.getByLabel(/fecha.*fin.*contrato/i).fill(newLeaseEndDate);

      // Verify formatted date display appears
      await expect(page.getByText(/formato.*15\/6\/2025/i)).toBeVisible();

      // Submit changes
      await page.getByRole('button', { name: /guardar.*cambios/i }).click();

      // Verify success
      await expect(page.getByText(/inquilino.*actualizado.*correctamente/i)).toBeVisible();
    });

    test('should handle deposit amount toggle', async ({ page }) => {
      // Create a test tenant
      const tenantData = await testData.createTestTenant();

      // Edit tenant
      const tenantRow = page.locator(`tr:has-text("${tenantData.name}")`);
      await tenantRow.getByRole('button', { name: /editar/i }).click();

      // Initially, deposit amount field should not be visible
      await expect(page.getByLabel(/monto.*depósito/i)).not.toBeVisible();

      // Toggle deposit switch
      await page.getByRole('switch', { name: /tiene.*depósito/i }).click();

      // Now deposit amount field should be visible
      await expect(page.getByLabel(/monto.*depósito/i)).toBeVisible();

      // Fill deposit amount
      await page.getByLabel(/monto.*depósito/i).fill('500');

      // Submit changes
      await page.getByRole('button', { name: /guardar.*cambios/i }).click();

      // Verify success
      await expect(page.getByText(/inquilino.*actualizado.*correctamente/i)).toBeVisible();
    });
  });

  test.describe('Tenant Deletion Workflow', () => {
    test('should delete tenant with confirmation', async ({ page }) => {
      // Create a test tenant
      const tenantData = await testData.createTestTenant();

      // Find and click delete button
      const tenantRow = page.locator(`tr:has-text("${tenantData.name}")`);
      await tenantRow.getByRole('button', { name: /eliminar/i }).click();

      // Verify confirmation dialog
      await expect(page.getByText(/eliminar.*inquilino/i)).toBeVisible();
      await expect(page.getByText(tenantData.name)).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /eliminar/i }).click();

      // Verify success message
      await expect(page.getByText(/inquilino.*eliminado.*exitosamente/i)).toBeVisible();

      // Verify tenant is removed from list
      await expect(page.getByText(tenantData.name)).not.toBeVisible();
    });

    test('should cancel tenant deletion', async ({ page }) => {
      // Create a test tenant
      const tenantData = await testData.createTestTenant();

      // Find and click delete button
      const tenantRow = page.locator(`tr:has-text("${tenantData.name}")`);
      await tenantRow.getByRole('button', { name: /eliminar/i }).click();

      // Cancel deletion
      await page.getByRole('button', { name: /cancelar/i }).click();

      // Verify tenant is still in list
      await expect(page.getByText(tenantData.name)).toBeVisible();
    });
  });

  test.describe('Tenant List and Filtering', () => {
    test('should filter tenants by status', async ({ page }) => {
      // Create tenants with different statuses
      const activeTenant = await testData.createTestTenant({ 
        name: 'Active Tenant',
        status: 'active' 
      });
      const inactiveTenant = await testData.createTestTenant({ 
        name: 'Inactive Tenant',
        status: 'inactive' 
      });

      // Initially, both tenants should be visible
      await expect(page.getByText(activeTenant.name)).toBeVisible();
      await expect(page.getByText(inactiveTenant.name)).toBeVisible();

      // Filter by active status
      await page.getByRole('combobox', { name: /estado/i }).click();
      await page.getByText('Activo').click();

      // Only active tenant should be visible
      await expect(page.getByText(activeTenant.name)).toBeVisible();
      await expect(page.getByText(inactiveTenant.name)).not.toBeVisible();

      // Filter by inactive status
      await page.getByRole('combobox', { name: /estado/i }).click();
      await page.getByText('Inactivo').click();

      // Only inactive tenant should be visible
      await expect(page.getByText(activeTenant.name)).not.toBeVisible();
      await expect(page.getByText(inactiveTenant.name)).toBeVisible();
    });

    test('should search tenants by name and email', async ({ page }) => {
      // Create test tenants
      const tenant1 = await testData.createTestTenant({ 
        name: 'John Smith',
        email: 'john@example.com'
      });
      const tenant2 = await testData.createTestTenant({ 
        name: 'Jane Doe',
        email: 'jane@example.com'
      });

      // Search by name
      await page.getByPlaceholder(/buscar.*inquilinos/i).fill('John');

      // Only matching tenant should be visible
      await expect(page.getByText(tenant1.name)).toBeVisible();
      await expect(page.getByText(tenant2.name)).not.toBeVisible();

      // Clear search and search by email
      await page.getByPlaceholder(/buscar.*inquilinos/i).clear();
      await page.getByPlaceholder(/buscar.*inquilinos/i).fill('jane@');

      // Only matching tenant should be visible
      await expect(page.getByText(tenant1.name)).not.toBeVisible();
      await expect(page.getByText(tenant2.name)).toBeVisible();
    });

    test('should sort tenants by different criteria', async ({ page }) => {
      // Create tenants with different data
      const tenantA = await testData.createTestTenant({ 
        name: 'Alice Johnson',
        unit: '101',
        rentAmount: 1000
      });
      const tenantB = await testData.createTestTenant({ 
        name: 'Bob Wilson',
        unit: '102',
        rentAmount: 1200
      });

      // Sort by name
      await page.getByRole('combobox', { name: /ordenar/i }).click();
      await page.getByText('Nombre').click();

      // Verify order (Alice should come before Bob)
      const tenantRows = page.locator('tbody tr');
      await expect(tenantRows.first()).toContainText('Alice Johnson');

      // Sort by rent amount
      await page.getByRole('combobox', { name: /ordenar/i }).click();
      await page.getByText('Renta').click();

      // Verify order (lower rent should come first)
      await expect(tenantRows.first()).toContainText('1000');
    });
  });

  test.describe('Responsive Design and Mobile', () => {
    test('should work correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Create a test tenant
      const tenantData = await testData.createTestTenant();

      // Verify tenant list is responsive
      await expect(page.getByText(tenantData.name)).toBeVisible();

      // Test mobile-specific interactions
      await page.getByRole('button', { name: /agregar.*inquilino/i }).click();
      
      // Verify modal is responsive
      await expect(page.getByText('Agregar Nuevo Inquilino')).toBeVisible();
      
      // Form should be usable on mobile
      await page.getByLabel(/nombre/i).fill('Mobile Test Tenant');
      await page.getByLabel(/correo/i).fill('mobile@test.com');
      
      // Cancel to avoid creating actual tenant
      await page.getByRole('button', { name: /cancelar/i }).click();
    });

    test('should handle tablet viewport correctly', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create test tenants
      await testData.createTestTenant({ name: 'Tablet Test 1' });
      await testData.createTestTenant({ name: 'Tablet Test 2' });

      // Verify layout works on tablet
      await expect(page.getByText('Tablet Test 1')).toBeVisible();
      await expect(page.getByText('Tablet Test 2')).toBeVisible();

      // Test tablet-specific interactions
      const tenantRow = page.locator('tr:has-text("Tablet Test 1")');
      await tenantRow.getByRole('button', { name: /editar/i }).click();

      // Verify edit modal works on tablet
      await expect(page.getByText('Editar Inquilino')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/tenants**', route => route.abort());

      // Try to create a tenant
      await page.getByRole('button', { name: /agregar.*inquilino/i }).click();
      
      const tenantData = testData.generateTenantData();
      await page.getByLabel(/nombre/i).fill(tenantData.name);
      await page.getByLabel(/correo/i).fill(tenantData.email);
      await page.getByLabel(/monto.*renta/i).fill('1000');
      
      await page.getByRole('button', { name: /crear.*inquilino/i }).click();

      // Should show error message
      await expect(page.getByText(/error.*guardar.*inquilino/i)).toBeVisible();
    });

    test('should handle duplicate email validation', async ({ page }) => {
      // Create a tenant first
      const existingTenant = await testData.createTestTenant();

      // Try to create another tenant with same email
      await page.getByRole('button', { name: /agregar.*inquilino/i }).click();
      
      await page.getByLabel(/nombre/i).fill('Duplicate Email Test');
      await page.getByLabel(/correo/i).fill(existingTenant.email);
      await page.getByLabel(/monto.*renta/i).fill('1000');
      
      await page.getByRole('button', { name: /crear.*inquilino/i }).click();

      // Should show validation error
      await expect(page.getByText(/email.*ya.*existe/i)).toBeVisible();
    });

    test('should handle empty tenant list gracefully', async ({ page }) => {
      // Navigate to tenants page with no tenants
      await page.goto('/tenants');

      // Should show empty state message
      await expect(page.getByText(/no.*encontraron.*inquilinos/i)).toBeVisible();
      
      // Add button should still be available
      await expect(page.getByRole('button', { name: /agregar.*inquilino/i })).toBeVisible();
    });
  });
});