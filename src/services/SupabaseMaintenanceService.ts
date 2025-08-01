
import { supabase } from "@/integrations/supabase/client";
import { SupabaseService } from "./SupabaseService";
import { MaintenanceRequest } from "@/types";

export class SupabaseMaintenanceService extends SupabaseService {
  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .or(`user_id.eq.${user.id},landlord_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching maintenance requests:', error);
      throw error;
    }

    return data.map(this.mapSupabaseMaintenanceToMaintenance);
  }

  async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching maintenance request:', error);
      throw error;
    }

    return this.mapSupabaseMaintenanceToMaintenance(data);
  }

  async getMaintenanceRequestsByTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenant maintenance requests:', error);
      throw error;
    }

    return data.map(this.mapSupabaseMaintenanceToMaintenance);
  }

  async createMaintenanceRequest(request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = await this.ensureAuthenticated();
    
    // Find tenant's landlord to set landlord_id
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('landlord_id')
      .eq('id', request.tenantId)
      .single();
    
    const requestData = {
      user_id: user.id,
      tenant_id: request.tenantId,
      landlord_id: tenantData?.landlord_id || null,
      title: request.title,
      description: request.description,
      
      priority: request.priority,
      status: request.status,
      unit_number: request.unit,
      assigned_to: request.assignedTo || null
    };

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert(requestData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating maintenance request:', error);
      throw error;
    }

    return data.id;
  }

  async updateMaintenanceRequest(id: string, updates: Partial<MaintenanceRequest>): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.status) updateData.status = updates.status;
    if (updates.unit) {
      updateData.unit_number = updates.unit;
    }
    if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;

    const { error } = await supabase
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', id)
      .or(`user_id.eq.${user.id},landlord_id.eq.${user.id}`);

    if (error) {
      console.error('Error updating maintenance request:', error);
      throw error;
    }

    return true;
  }

  async deleteMaintenanceRequest(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('maintenance_requests')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting maintenance request:', error);
      throw error;
    }

    return true;
  }

  private mapSupabaseMaintenanceToMaintenance(data: any): MaintenanceRequest {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      unit: data.unit || data.unit_number,
      title: data.title,
      description: data.description,
      category: 'plumbing' as MaintenanceRequest['category'],
      priority: data.priority as MaintenanceRequest['priority'],
      status: data.status as MaintenanceRequest['status'],
      assignedTo: data.assigned_to || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at || undefined
    };
  }
}
