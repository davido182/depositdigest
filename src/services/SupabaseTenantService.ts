import { BaseService } from './BaseService';
import { Tenant } from '@/types';

export class SupabaseTenantService extends BaseService {
  
  // Utility method to validate and clean UUID
  private validateUUID(value: any): string | null {
    if (!value || typeof value !== 'string') return null;
    const cleaned = value.trim();
    if (cleaned === '' || cleaned === 'undefined' || cleaned === 'null') return null;
    // Basic UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(cleaned) ? cleaned : null;
  }

  // Utility method to safely convert to number
  private safeNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  // Utility method to format date
  private formatDate(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  async getTenants(): Promise<Tenant[]> {
    console.log('🔍 [DEFINITIVE] Fetching tenants from Supabase...');

    const user = await this.ensureAuthenticated();
    console.log('👤 [DEFINITIVE] User authenticated:', user.id);

    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [DEFINITIVE] Error fetching tenants:', error);
      throw new Error(`Failed to fetch tenants: ${error.message}`);
    }

    console.log('✅ [DEFINITIVE] Fetched tenants:', data?.length || 0);

    if (!data || data.length === 0) {
      return [];
    }

    // Transform using COMPLETE mapping of all 31 fields
    return data.map(tenant => {
      // Combine name fields intelligently
      const fullName = tenant.name || 
                      `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() || 
                      'Sin nombre';

      // Get the most recent/accurate values from duplicate fields
      const moveInDate = tenant.moveindate || tenant.move_in_date || '';
      const leaseEndDate = tenant.leaseenddate || tenant.move_out_date || '';
      const rentAmount = this.safeNumber(tenant.rent_amount || tenant.monthly_rent);
      const depositAmount = this.safeNumber(tenant.depositamount || tenant.deposit_paid);
      const isActive = tenant.status === 'active' || tenant.is_active === true;
      
      return {
        id: tenant.id,
        user_id: tenant.user_id || tenant.landlord_id,
        landlord_id: tenant.landlord_id,
        name: fullName,
        email: tenant.email || '',
        phone: tenant.phone || '',
        lease_start_date: moveInDate,
        lease_end_date: leaseEndDate,
        rent_amount: rentAmount,
        status: tenant.status || (isActive ? 'active' : 'inactive'),
        unit_number: 'Sin unidad', // Will be loaded from units table
        property_id: tenant.property_id,
        property_name: tenant.property_name || 'Sin propiedad',
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        
        // Legacy aliases for forms compatibility
        unit: 'Sin unidad',
        moveInDate: moveInDate,
        leaseEndDate: leaseEndDate,
        rentAmount: rentAmount,
        depositAmount: depositAmount,
        paymentHistory: [],
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
        propertyName: tenant.property_name || 'Sin propiedad',
        propertyAddress: '',
        notes: tenant.notes || '',
      };
    });
  }

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<Tenant> {
    console.log('📝 [DEFINITIVE] Creating tenant:', tenant);

    const user = await this.ensureAuthenticated();

    // Prepare insert data with COMPLETE field mapping and validation
    const insertData = {
      // Required fields
      landlord_id: user.id,
      
      // Name fields (sync all variants)
      name: tenant.name || 'Sin nombre',
      first_name: tenant.name?.split(' ')[0] || 'Sin nombre',
      last_name: tenant.name?.split(' ').slice(1).join(' ') || '',
      
      // Contact fields
      email: tenant.email || null,
      phone: tenant.phone || null,
      
      // Date fields (sync both variants)
      moveindate: this.formatDate(tenant.moveInDate),
      move_in_date: this.formatDate(tenant.moveInDate),
      leaseenddate: this.formatDate(tenant.leaseEndDate),
      move_out_date: this.formatDate(tenant.leaseEndDate),
      
      // Financial fields (sync both variants)
      rent_amount: this.safeNumber(tenant.rentAmount),
      monthly_rent: this.safeNumber(tenant.rentAmount),
      depositamount: this.safeNumber(tenant.depositAmount),
      deposit_paid: this.safeNumber(tenant.depositAmount),
      
      // Status fields (sync both variants)
      status: tenant.status || 'active',
      is_active: (tenant.status || 'active') === 'active',
      
      // Property fields (with UUID validation)
      property_id: this.validateUUID((tenant as any).propertyId || tenant.property_id),
      property_name: (tenant as any).propertyName || tenant.property_name || null,
      
      // Additional fields
      notes: tenant.notes || null,
    };

    console.log('📋 [DEFINITIVE] Insert data prepared:', insertData);

    const { data, error } = await this.supabase
      .from('tenants')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ [DEFINITIVE] Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    console.log('✅ [DEFINITIVE] Created tenant:', data);

    // Return formatted data
    return this.formatTenantResponse(data);
  }

  async updateTenant(id: string, updates: Partial<Tenant & { propertyId?: string }>): Promise<Tenant> {
    console.log('🔄 [DEFINITIVE] Updating tenant:', id);
    console.log('📥 [DEFINITIVE] Updates received:', updates);

    const user = await this.ensureAuthenticated();

    // Prepare update data with COMPLETE field mapping and validation
    const updateData: any = {};

    // Name fields (update all variants if name changes)
    if (updates.name !== undefined) {
      updateData.name = updates.name || 'Sin nombre';
      updateData.first_name = updates.name?.split(' ')[0] || 'Sin nombre';
      updateData.last_name = updates.name?.split(' ').slice(1).join(' ') || '';
    }

    // Contact fields
    if (updates.email !== undefined) {
      updateData.email = updates.email || null;
    }
    if (updates.phone !== undefined) {
      updateData.phone = updates.phone || null;
    }

    // Date fields (update both variants)
    if (updates.moveInDate !== undefined) {
      const formattedDate = this.formatDate(updates.moveInDate);
      updateData.moveindate = formattedDate;
      updateData.move_in_date = formattedDate;
    }
    if (updates.leaseEndDate !== undefined) {
      const formattedDate = this.formatDate(updates.leaseEndDate);
      updateData.leaseenddate = formattedDate;
      updateData.move_out_date = formattedDate;
    }

    // Financial fields (update both variants)
    if (updates.rentAmount !== undefined) {
      const amount = this.safeNumber(updates.rentAmount);
      updateData.rent_amount = amount;
      updateData.monthly_rent = amount;
    }
    if (updates.depositAmount !== undefined) {
      const amount = this.safeNumber(updates.depositAmount);
      updateData.depositamount = amount;
      updateData.deposit_paid = amount;
    }

    // Status fields (update both variants)
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      updateData.is_active = updates.status === 'active';
    }

    // Property fields (with UUID validation)
    if (updates.propertyId !== undefined) {
      updateData.property_id = this.validateUUID(updates.propertyId);
      updateData.property_name = updates.propertyName || null;
    }

    // Additional fields
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes || null;
    }

    console.log('📤 [DEFINITIVE] Mapped update data:', updateData);

    const { data, error } = await this.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .eq('landlord_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ [DEFINITIVE] Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    console.log('✅ [DEFINITIVE] Updated tenant:', data);

    // Return formatted data
    return this.formatTenantResponse(data);
  }

  async deleteTenant(id: string): Promise<boolean> {
    console.log('🗑️ [DEFINITIVE] Deleting tenant:', id);

    const user = await this.ensureAuthenticated();

    // First, unassign from any units
    await this.unassignTenantFromUnits(id);

    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id)
      .eq('landlord_id', user.id);

    if (error) {
      console.error('❌ [DEFINITIVE] Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }

    console.log('✅ [DEFINITIVE] Tenant deleted successfully');
    return true;
  }

  // Helper method to format tenant response consistently
  private formatTenantResponse(data: any): Tenant {
    const fullName = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Sin nombre';
    const moveInDate = data.moveindate || data.move_in_date || '';
    const leaseEndDate = data.leaseenddate || data.move_out_date || '';
    const rentAmount = this.safeNumber(data.rent_amount || data.monthly_rent);
    const depositAmount = this.safeNumber(data.depositamount || data.deposit_paid);
    const isActive = data.status === 'active' || data.is_active === true;

    return {
      id: data.id,
      user_id: data.user_id || data.landlord_id,
      landlord_id: data.landlord_id,
      name: fullName,
      email: data.email || '',
      phone: data.phone || '',
      lease_start_date: moveInDate,
      lease_end_date: leaseEndDate,
      rent_amount: rentAmount,
      status: data.status || (isActive ? 'active' : 'inactive'),
      unit_number: '',
      property_id: data.property_id,
      property_name: data.property_name || 'Sin propiedad',
      created_at: data.created_at,
      updated_at: data.updated_at,
      
      // Legacy aliases
      unit: 'Sin unidad',
      moveInDate: moveInDate,
      leaseEndDate: leaseEndDate,
      rentAmount: rentAmount,
      depositAmount: depositAmount,
      paymentHistory: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      propertyName: data.property_name || 'Sin propiedad',
      propertyAddress: '',
      notes: data.notes || '',
    };
  }

  // Helper method to unassign tenant from units
  private async unassignTenantFromUnits(tenantId: string): Promise<void> {
    try {
      console.log('🏠 [DEFINITIVE] Unassigning tenant from units:', tenantId);

      const { error } = await this.supabase
        .from('units')
        .update({
          tenant_id: null,
          is_available: true
        })
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('❌ [DEFINITIVE] Error unassigning tenant from units:', error);
      } else {
        console.log('✅ [DEFINITIVE] Tenant unassigned from units successfully');
      }
    } catch (error) {
      console.error('❌ [DEFINITIVE] Error in unassignTenantFromUnits:', error);
    }
  }
}