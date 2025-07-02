
import { SupabaseMaintenanceService } from './SupabaseMaintenanceService';

// Always use Supabase service instead of mock data
export const maintenanceService = new SupabaseMaintenanceService();
