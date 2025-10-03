
import { supabase } from "@/integrations/supabase/client";
import { SupabaseService } from "./SupabaseService";
import { Payment, PaymentMethod } from "@/types";

export class SupabasePaymentService extends SupabaseService {
  async getPayments(): Promise<Payment[]> {
    console.log('Fetching payments from Supabase...');
    
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }

    return data.map(payment => this.mapSupabasePaymentToPayment(payment));
  }

  async createPayment(paymentData: any): Promise<string> {
    console.log('SupabasePaymentService: Creating payment with data:', paymentData);
    
    // Ensure authenticated user
    const user = await this.ensureAuthenticated();
    const payload = { ...paymentData };
    
    const { data, error } = await supabase
      .from('payments')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('SupabasePaymentService: Error creating payment:', error);
      throw new Error(`Error al crear el pago: ${error.message}`);
    }

    console.log('SupabasePaymentService: Payment created successfully:', data);
    return data!.id;
  }

  async updatePayment(id: string, paymentData: any): Promise<boolean> {
    console.log('SupabasePaymentService: Updating payment with data:', paymentData);
    
    const user = await this.ensureAuthenticated();
    
    // Remove id from update data if present
    const { id: _, ...updateData } = paymentData;
    
    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('SupabasePaymentService: Error updating payment:', error);
      throw new Error(`Error al actualizar el pago: ${error.message}`);
    }

    console.log('SupabasePaymentService: Payment updated successfully');
    return true;
  }

  async deletePayment(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }

    return true;
  }

  private mapPaymentMethodToDb(method: PaymentMethod): string {
    const methodMap: Record<PaymentMethod, string> = {
      'transfer': 'bank_transfer',
      'card': 'credit_card',
      'cash': 'cash',
      'check': 'check',
      'other': 'cash'
    };
    return methodMap[method] || 'cash';
  }

  private mapDbPaymentMethodToApp(dbMethod: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      'bank_transfer': 'transfer',
      'credit_card': 'card',
      'cash': 'cash',
      'check': 'check'
    };
    return methodMap[dbMethod] as PaymentMethod || 'cash';
  }

  private mapSupabasePaymentToPayment(data: any): Payment {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      amount: parseFloat(data.amount),
      date: data.payment_date,
      type: 'rent', // Default to rent for now
      method: this.mapDbPaymentMethodToApp(data.payment_method),
      status: data.status,
      notes: data.notes || '',
      createdAt: data.created_at,
      receipt_file_path: data.receipt_file_path
    };
  }
}
