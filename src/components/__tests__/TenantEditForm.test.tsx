import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TenantEditForm } from '../tenants/TenantEditForm';
import { mockSupabaseClient } from '../test/mocks/supabase';
import { Tenant } from '@/types';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/services/PropertyService', () => ({
  propertyService: {
    getProperties: vi.fn().mockResolvedValue([
      { id: '1', name: 'Test Property', address: '123 Test St' }
    ])
  }
}));

describe('TenantEditForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const mockTenant: Tenant = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    unit: '101',
    moveInDate: '2024-01-01',
    leaseEndDate: '2024-12-31',
    rentAmount: 1000,
    depositAmount: 500,
    status: 'active',
    paymentHistory: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    });
  });

  describe('Form Rendering', () => {
    it('should render form for new tenant', () => {
      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Agregar Nuevo Inquilino')).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Correo Electrónico/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
      expect(screen.getByText('Crear Inquilino')).toBeInTheDocument();
    });

    it('should render form for editing existing tenant', () => {
      render(
        <TenantEditForm
          tenant={mockTenant}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Editar Inquilino')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('Guardar Cambios')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <TenantEditForm
          tenant={null}
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('Agregar Nuevo Inquilino')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty name', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const submitButton = screen.getByText('Crear Inquilino');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nombre.*requerido/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre/);
      const emailInput = screen.getByLabelText(/Correo Electrónico/);
      const submitButton = screen.getByText('Crear Inquilino');

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email.*inválido/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for negative rent amount', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre/);
      const rentInput = screen.getByLabelText(/Monto de Renta/);
      const submitButton = screen.getByText('Crear Inquilino');

      await user.type(nameInput, 'John Doe');
      await user.clear(rentInput);
      await user.type(rentInput, '-100');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/renta.*positivo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should update form fields when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByLabelText(/Nombre/) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Correo Electrónico/) as HTMLInputElement;

      await user.type(nameInput, 'Jane Smith');
      await user.type(emailInput, 'jane@example.com');

      expect(nameInput.value).toBe('Jane Smith');
      expect(emailInput.value).toBe('jane@example.com');
    });

    it('should toggle deposit amount field when switch is toggled', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const depositSwitch = screen.getByRole('switch', { name: /Tiene Depósito/i });
      
      // Initially, deposit amount field should not be visible
      expect(screen.queryByLabelText(/Monto del Depósito/)).not.toBeInTheDocument();

      await user.click(depositSwitch);

      // After clicking switch, deposit amount field should be visible
      expect(screen.getByLabelText(/Monto del Depósito/)).toBeInTheDocument();
    });

    it('should load units when property is selected', async () => {
      const user = userEvent.setup();
      
      // Mock units data
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { unit_number: '101', is_available: true, rent_amount: 1000 },
              { unit_number: '102', is_available: false, rent_amount: 1200 }
            ],
            error: null
          })
        })
      });

      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for properties to load and select one
      await waitFor(() => {
        expect(screen.getByText('Test Property')).toBeInTheDocument();
      });

      const propertySelect = screen.getByRole('combobox', { name: /Propiedad/ });
      await user.click(propertySelect);
      await user.click(screen.getByText('Test Property'));

      // Units should be loaded
      await waitFor(() => {
        const unitSelect = screen.getByRole('combobox', { name: /Unidad/ });
        expect(unitSelect).toBeEnabled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with correct data when form is submitted', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Fill out the form
      await user.type(screen.getByLabelText(/Nombre/), 'Jane Smith');
      await user.type(screen.getByLabelText(/Correo Electrónico/), 'jane@example.com');
      await user.type(screen.getByLabelText(/Teléfono/), '(555) 987-6543');
      await user.type(screen.getByLabelText(/Monto de Renta/), '1200');

      const submitButton = screen.getByText('Crear Inquilino');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '(555) 987-6543',
            rentAmount: 1200
          })
        );
      });
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should update existing tenant when editing', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={mockTenant}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Update the name
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'John Updated');

      const submitButton = screen.getByText('Guardar Cambios');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            name: 'John Updated',
            email: 'john@example.com'
          })
        );
      });
    });
  });

  describe('Date Handling', () => {
    it('should format dates correctly for display', () => {
      render(
        <TenantEditForm
          tenant={mockTenant}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Check that dates are displayed in the correct format
      const moveInInput = screen.getByLabelText(/Fecha de Ingreso/) as HTMLInputElement;
      const leaseEndInput = screen.getByLabelText(/Fecha Fin de Contrato/) as HTMLInputElement;

      expect(moveInInput.value).toBe('2024-01-01');
      expect(leaseEndInput.value).toBe('2024-12-31');
    });

    it('should show formatted date display below inputs', () => {
      render(
        <TenantEditForm
          tenant={mockTenant}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Check for formatted date display (DD/MM/YYYY format)
      expect(screen.getByText(/Formato: 1\/1\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/Formato: 31\/12\/2024/)).toBeInTheDocument();
    });

    it('should handle date changes correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <TenantEditForm
          tenant={mockTenant}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const moveInInput = screen.getByLabelText(/Fecha de Ingreso/);
      await user.clear(moveInInput);
      await user.type(moveInInput, '2024-06-15');

      const submitButton = screen.getByText('Guardar Cambios');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            moveInDate: '2024-06-15'
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock onSave to throw an error
      mockOnSave.mockRejectedValueOnce(new Error('API Error'));

      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Fill out minimal form
      await user.type(screen.getByLabelText(/Nombre/), 'Jane Smith');
      await user.type(screen.getByLabelText(/Monto de Renta/), '1000');

      const submitButton = screen.getByText('Crear Inquilino');
      await user.click(submitButton);

      // Form should remain open and show error
      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should handle property loading errors', async () => {
      // Mock property service to throw error
      vi.mocked(require('@/services/PropertyService').propertyService.getProperties)
        .mockRejectedValueOnce(new Error('Failed to load properties'));

      render(
        <TenantEditForm
          tenant={null}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Should still render form even if properties fail to load
      expect(screen.getByText('Agregar Nuevo Inquilino')).toBeInTheDocument();
    });
  });
});