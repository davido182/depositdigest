
import { SupabasePaymentService } from './SupabasePaymentService';

// Always use Supabase service instead of mock data
export const paymentService = new SupabasePaymentService();
