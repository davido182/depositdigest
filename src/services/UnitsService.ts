import { SupabaseService } from "./SupabaseService";

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  tenant_id?: string | null;
  rent_amount?: number | null;
  is_available: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class UnitsService extends SupabaseService {
  async getUnits(propertyId?: string): Promise<Unit[]> {
    // Temporary mock implementation until units table is properly available
    return [];
  }

  async createUnit(unit: Omit<Unit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<string> {
    // Temporary mock implementation
    return 'mock-id';
  }

  async updateUnit(id: string, updates: Partial<Unit>): Promise<boolean> {
    // Temporary mock implementation
    return true;
  }

  async deleteUnit(id: string): Promise<boolean> {
    // Temporary mock implementation
    return true;
  }

  async assignTenant(unitId: string, tenantId: string, rentAmount: number): Promise<boolean> {
    // Temporary mock implementation
    return true;
  }

  async unassignTenant(unitId: string): Promise<boolean> {
    // Temporary mock implementation
    return true;
  }
}

export const unitsService = new UnitsService();