import { test, expect } from '@playwright/test';
import { AuthFixture } from '../fixtures/auth';
import { TestDataHelper } from '../utils/test-data';

test.describe('Property Management E2E Tests', () => {
  let auth: AuthFixture;
  let testData: TestDataHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthFixture(page);
    testData = new TestDataHelper();
    
    // Login before each test
    await auth.login();
    
    // Navigate to properties page
    await page.goto('/properties');
    await expect(page.getByText('Gestión de Propiedades')).toBeVisible();
  });

  test.afterEach(async () => {
    // Clean up test data
    await testData.cleanup();
  });

  test.describe('Property Creation Workflow', () => {
    test('should create a new property successfully', async ({ page }) => {
      // Click "Add New Property" button
      await page.getByRole('button', { name: /agregar.*propiedad/i }).click();
      
      // Verify modal opens
      await expect(page.getByText('Agregar Nueva Propiedad')).toBeVisible();

      // Fill out property form
      const propertyData = testData.generatePropertyData();
      
      await page.getByLabel(/nombre/i).fill(propertyData.name);
      await page.getByLabel(/dirección/i).fill(propertyData.address);
      await page.getByLabel(/total.*unidades/i).fill(propertyData.total_units.toString());
      await page.getByLabel(/descripción/i).fill(propertyData.description);

      // Submit form
      await page.getByRole('button', { name: /crear.*propiedad/i }).click();

      // Verify success message
      await expect(page.getByText(/propiedad.*creada.*correctamente/i)).toBeVisible();

      // Verify property appears in list
      await expect(page.getByText(propertyData.name)).toBeVisible();
      await expect(page.getByText(propertyData.address)).toBeVisible();
    });

    test('should create property with automatic unit generation', async ({ page }) => {
      // Click "Add New Property" button
      await page.getByRole('button', { name: /agregar.*propiedad/i }).click();

      // Fill property form with multiple units
      const propertyData = testData.generatePropertyData({ total_units: 3 });
      
      await page.getByLabel(/nombre/i).fill(propertyData.name);
      await page.getByLabel(/dirección/i).fill(propertyData.address);
      await page.getByLabel(/total.*unidades/i).fill('3');

      // Enable automatic unit generation
      await page.getByRole('switch', { name: /generar.*unidades.*automáticamente/i }).click();

      // Set base rent amount
      await page.getByLabel(/renta.*base/i).fill('1000');

      // Submit form
      await page.getByRole('button', { name: /crear.*propiedad/i }).click();

      // Verify success
      await expect(page.getByText(/propiedad.*creada.*correctamente/i)).toBeVisible();

      // Verify property card shows correct unit count
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await expect(propertyCard.getByText('3 unidades')).toBeVisible();
      await expect(propertyCard.getByText('3 disponibles')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      // Click "Add New Property" button
      await page.getByRole('button', { name: /agregar.*propiedad/i }).click();

      // Try to submit empty form
      await page.getByRole('button', { name: /crear.*propiedad/i }).click();

      // Verify validation errors
      await expect(page.getByText(/nombre.*requerido/i)).toBeVisible();
      
      // Fill invalid total units
      await page.getByLabel(/nombre/i).fill('Test Property');
      await page.getByLabel(/total.*unidades/i).fill('0');
      await page.getByRole('button', { name: /crear.*propiedad/i }).click();

      // Verify units validation error
      await expect(page.getByText(/unidades.*mayor.*0/i)).toBeVisible();
    });
  });

  test.describe('Property Editing Workflow', () => {
    test('should edit existing property successfully', async ({ page }) => {
      // Create a test property first
      const propertyData = await testData.createTestProperty();

      // Find and click edit button for the property
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await propertyCard.getByRole('button', { name: /editar/i }).click();

      // Verify edit modal opens
      await expect(page.getByText('Editar Propiedad')).toBeVisible();

      // Verify form is pre-filled
      await expect(page.getByDisplayValue(propertyData.name)).toBeVisible();
      await expect(page.getByDisplayValue(propertyData.address)).toBeVisible();

      // Update property information
      const updatedName = `${propertyData.name} Updated`;
      const updatedAddress = `${propertyData.address} Updated`;
      
      await page.getByLabel(/nombre/i).clear();
      await page.getByLabel(/nombre/i).fill(updatedName);
      await page.getByLabel(/dirección/i).clear();
      await page.getByLabel(/dirección/i).fill(updatedAddress);

      // Submit changes
      await page.getByRole('button', { name: /guardar.*cambios/i }).click();

      // Verify success message
      await expect(page.getByText(/propiedad.*actualizada.*correctamente/i)).toBeVisible();

      // Verify updated information appears in card
      await expect(page.getByText(updatedName)).toBeVisible();
      await expect(page.getByText(updatedAddress)).toBeVisible();
    });

    test('should update property unit count and manage units', async ({ page }) => {
      // Create a test property with units
      const propertyData = await testData.createTestProperty({ total_units: 2 });
      await testData.createTestUnit(propertyData.id, { unit_number: '101' });
      await testData.createTestUnit(propertyData.id, { unit_number: '102' });

      // Find property card and view units
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await propertyCard.getByRole('button', { name: /ver.*unidades/i }).click();

      // Verify units are displayed
      await expect(page.getByText('Unidad 101')).toBeVisible();
      await expect(page.getByText('Unidad 102')).toBeVisible();

      // Add a new unit
      await page.getByRole('button', { name: /agregar.*unidad/i }).click();
      
      await page.getByLabel(/número.*unidad/i).fill('103');
      await page.getByLabel(/renta.*mensual/i).fill('1200');
      await page.getByRole('button', { name: /crear.*unidad/i }).click();

      // Verify new unit appears
      await expect(page.getByText('Unidad 103')).toBeVisible();
      await expect(page.getByText('€1,200')).toBeVisible();
    });
  });

  test.describe('Unit Management Within Properties', () => {
    test('should edit unit information', async ({ page }) => {
      // Create property with unit
      const propertyData = await testData.createTestProperty();
      const unitData = await testData.createTestUnit(propertyData.id);

      // Navigate to property units
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await propertyCard.getByRole('button', { name: /ver.*unidades/i }).click();

      // Edit unit
      const unitRow = page.locator(`tr:has-text("${unitData.unit_number}")`);
      await unitRow.getByRole('button', { name: /editar/i }).click();

      // Verify edit modal opens
      await expect(page.getByText('Editar Unidad')).toBeVisible();

      // Update rent amount
      await page.getByLabel(/renta.*mensual/i).clear();
      await page.getByLabel(/renta.*mensual/i).fill('1500');

      // Submit changes
      await page.getByRole('button', { name: /guardar.*cambios/i }).click();

      // Verify success
      await expect(page.getByText(/unidad.*actualizada.*correctamente/i)).toBeVisible();

      // Verify updated rent appears
      await expect(page.getByText('€1,500')).toBeVisible();
    });

    test('should assign tenant to unit', async ({ page }) => {
      // Create property, unit, and tenant
      const propertyData = await testData.createTestProperty();
      const unitData = await testData.createTestUnit(propertyData.id);
      const tenantData = await testData.createTestTenant();

      // Navigate to property units
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await propertyCard.getByRole('button', { name: /ver.*unidades/i }).click();

      // Edit unit to assign tenant
      const unitRow = page.locator(`tr:has-text("${unitData.unit_number}")`);
      await unitRow.getByRole('button', { name: /editar/i }).click();

      // Select tenant
      await page.getByRole('combobox', { name: /inquilino/i }).click();
      await page.getByText(tenantData.name).click();

      // Submit changes
      await page.getByRole('button', { name: /guardar.*cambios/i }).click();

      // Verify success
      await expect(page.getByText(/cambios.*guardados.*correctamente/i)).toBeVisible();

      // Verify unit shows as occupied
      await expect(page.getByText('Ocupada')).toBeVisible();
      await expect(page.getByText(tenantData.name)).toBeVisible();
    });

    test('should delete unit with confirmation', async ({ page }) => {
      // Create property with unit
      const propertyData = await testData.createTestProperty();
      const unitData = await testData.createTestUnit(propertyData.id);

      // Navigate to property units
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await propertyCard.getByRole('button', { name: /ver.*unidades/i }).click();

      // Delete unit
      const unitRow = page.locator(`tr:has-text("${unitData.unit_number}")`);
      await unitRow.getByRole('button', { name: /eliminar/i }).click();

      // Verify confirmation dialog
      await expect(page.getByText(/eliminar.*unidad/i)).toBeVisible();
      await expect(page.getByText(unitData.unit_number)).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /eliminar/i }).click();

      // Verify success
      await expect(page.getByText(/unidad.*eliminada.*correctamente/i)).toBeVisible();

      // Verify unit is removed
      await expect(page.getByText(`Unidad ${unitData.unit_number}`)).not.toBeVisible();
    });
  });

  test.describe('Property Statistics and Overview', () => {
    test('should display correct property statistics', async ({ page }) => {
      // Create property with mixed unit occupancy
      const propertyData = await testData.createTestProperty({ total_units: 4 });
      
      // Create units with different statuses
      await testData.createTestUnit(propertyData.id, { 
        unit_number: '101', 
        monthly_rent: 1000, 
        is_available: false 
      });
      await testData.createTestUnit(propertyData.id, { 
        unit_number: '102', 
        monthly_rent: 1200, 
        is_available: false 
      });
      await testData.createTestUnit(propertyData.id, { 
        unit_number: '103', 
        monthly_rent: 1100, 
        is_available: true 
      });
      await testData.createTestUnit(propertyData.id, { 
        unit_number: '104', 
        monthly_rent: 1300, 
        is_available: true 
      });

      // Refresh page to see updated statistics
      await page.reload();

      // Find property card
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);

      // Verify statistics
      await expect(propertyCard.getByText('4 unidades')).toBeVisible();
      await expect(propertyCard.getByText('2 ocupadas')).toBeVisible();
      await expect(propertyCard.getByText('2 disponibles')).toBeVisible();
      await expect(propertyCard.getByText('50% ocupación')).toBeVisible();
      await expect(propertyCard.getByText('€2,200/mes')).toBeVisible(); // Current revenue from occupied units
    });

    test('should show property performance metrics', async ({ page }) => {
      // Create property with historical data
      const propertyData = await testData.createTestProperty();
      const unitData = await testData.createTestUnit(propertyData.id, { is_available: false });
      const tenantData = await testData.createTestTenant();
      
      // Create payment history
      await testData.createTestPayment(tenantData.id, { 
        amount: 1000, 
        payment_date: '2024-01-01' 
      });
      await testData.createTestPayment(tenantData.id, { 
        amount: 1000, 
        payment_date: '2024-02-01' 
      });

      // View property details
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await propertyCard.getByRole('button', { name: /ver.*detalles/i }).click();

      // Verify performance metrics are displayed
      await expect(page.getByText(/ingresos.*totales/i)).toBeVisible();
      await expect(page.getByText(/tasa.*cobro/i)).toBeVisible();
      await expect(page.getByText(/tiempo.*promedio.*ocupación/i)).toBeVisible();
    });
  });

  test.describe('Property Deletion Workflow', () => {
    test('should delete property with confirmation', async ({ page }) => {
      // Create a test property
      const propertyData = await testData.createTestProperty();

      // Find and click delete button
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await propertyCard.getByRole('button', { name: /eliminar/i }).click();

      // Verify confirmation dialog
      await expect(page.getByText(/eliminar.*propiedad/i)).toBeVisible();
      await expect(page.getByText(propertyData.name)).toBeVisible();
      await expect(page.getByText(/esta.*acción.*no.*se.*puede.*deshacer/i)).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /eliminar/i }).click();

      // Verify success message
      await expect(page.getByText(/propiedad.*eliminada.*correctamente/i)).toBeVisible();

      // Verify property is removed from list
      await expect(page.getByText(propertyData.name)).not.toBeVisible();
    });

    test('should prevent deletion of property with tenants', async ({ page }) => {
      // Create property with tenant
      const propertyData = await testData.createTestProperty();
      const unitData = await testData.createTestUnit(propertyData.id, { is_available: false });
      const tenantData = await testData.createTestTenant();

      // Assign tenant to unit
      await testData.assignTenantToUnit(tenantData.id, unitData.id);

      // Try to delete property
      const propertyCard = page.locator(`[data-testid="property-card"]:has-text("${propertyData.name}")`);
      await propertyCard.getByRole('button', { name: /eliminar/i }).click();

      // Should show warning about existing tenants
      await expect(page.getByText(/no.*puede.*eliminar.*propiedad.*con.*inquilinos/i)).toBeVisible();
      
      // Delete button should be disabled or show different message
      const deleteButton = page.getByRole('button', { name: /eliminar/i });
      await expect(deleteButton).toBeDisabled();
    });
  });

  test.describe('Property Search and Filtering', () => {
    test('should search properties by name and address', async ({ page }) => {
      // Create test properties
      const property1 = await testData.createTestProperty({ 
        name: 'Sunset Apartments',
        address: '123 Sunset Blvd'
      });
      const property2 = await testData.createTestProperty({ 
        name: 'Ocean View Complex',
        address: '456 Ocean Drive'
      });

      // Search by name
      await page.getByPlaceholder(/buscar.*propiedades/i).fill('Sunset');

      // Only matching property should be visible
      await expect(page.getByText(property1.name)).toBeVisible();
      await expect(page.getByText(property2.name)).not.toBeVisible();

      // Clear search and search by address
      await page.getByPlaceholder(/buscar.*propiedades/i).clear();
      await page.getByPlaceholder(/buscar.*propiedades/i).fill('Ocean Drive');

      // Only matching property should be visible
      await expect(page.getByText(property1.name)).not.toBeVisible();
      await expect(page.getByText(property2.name)).toBeVisible();
    });

    test('should filter properties by occupancy status', async ({ page }) => {
      // Create properties with different occupancy
      const fullProperty = await testData.createTestProperty({ name: 'Full Property' });
      await testData.createTestUnit(fullProperty.id, { is_available: false });

      const emptyProperty = await testData.createTestProperty({ name: 'Empty Property' });
      await testData.createTestUnit(emptyProperty.id, { is_available: true });

      // Filter by fully occupied
      await page.getByRole('combobox', { name: /filtrar/i }).click();
      await page.getByText('Completamente ocupadas').click();

      // Only full property should be visible
      await expect(page.getByText('Full Property')).toBeVisible();
      await expect(page.getByText('Empty Property')).not.toBeVisible();

      // Filter by available units
      await page.getByRole('combobox', { name: /filtrar/i }).click();
      await page.getByText('Con unidades disponibles').click();

      // Only empty property should be visible
      await expect(page.getByText('Full Property')).not.toBeVisible();
      await expect(page.getByText('Empty Property')).toBeVisible();
    });
  });

  test.describe('Responsive Design and Mobile', () => {
    test('should work correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Create a test property
      const propertyData = await testData.createTestProperty();

      // Verify property card is responsive
      await expect(page.getByText(propertyData.name)).toBeVisible();

      // Test mobile-specific interactions
      await page.getByRole('button', { name: /agregar.*propiedad/i }).click();
      
      // Verify modal is responsive
      await expect(page.getByText('Agregar Nueva Propiedad')).toBeVisible();
      
      // Form should be usable on mobile
      await page.getByLabel(/nombre/i).fill('Mobile Test Property');
      await page.getByLabel(/dirección/i).fill('123 Mobile St');
      
      // Cancel to avoid creating actual property
      await page.getByRole('button', { name: /cancelar/i }).click();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/properties**', route => route.abort());

      // Try to create a property
      await page.getByRole('button', { name: /agregar.*propiedad/i }).click();
      
      const propertyData = testData.generatePropertyData();
      await page.getByLabel(/nombre/i).fill(propertyData.name);
      await page.getByLabel(/dirección/i).fill(propertyData.address);
      await page.getByLabel(/total.*unidades/i).fill('2');
      
      await page.getByRole('button', { name: /crear.*propiedad/i }).click();

      // Should show error message
      await expect(page.getByText(/error.*guardar.*propiedad/i)).toBeVisible();
    });

    test('should handle empty property list gracefully', async ({ page }) => {
      // Navigate to properties page with no properties
      await page.goto('/properties');

      // Should show empty state message
      await expect(page.getByText(/no.*tienes.*propiedades/i)).toBeVisible();
      
      // Add button should still be available
      await expect(page.getByRole('button', { name: /agregar.*propiedad/i })).toBeVisible();
    });
  });
});