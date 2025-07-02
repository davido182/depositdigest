
import { SupabaseTenantService } from './SupabaseTenantService';

// Always use Supabase service instead of mock data
export const tenantService = new SupabaseTenantService();
