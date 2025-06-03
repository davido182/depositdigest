
import { supabase } from "@/integrations/supabase/client";
import { SupabaseService } from "./SupabaseService";
import { Payment } from "@/types";

export class SupabasePaymentService extends SupabaseService {
  async getPayments(): Promise<Payment[]> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }

    return data.map(this.mapSupabasePaymentToPayment);
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    const user = await this.ensureAuthenticated();
    
    const paymentData = {
      user_id: user.id,
      tenant_id: payment.tenantId,
      amount: payment.amount,
      payment_date: payment.date,
      payment_method: this.mapPaymentMethodToDb(payment.method),
      status: payment.status,
      notes: payment.notes
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw error;
    }

    return data.id;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const updateData: any = {};
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.date) updateData.payment_date = updates.date;
    if (updates.method) updateData.payment_method = this.mapPaymentMethodToDb(updates.method);
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating payment:', error);
      throw error;
    }

    return true;
  }

  async deletePayment(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }

    return true;
  }

  private mapPaymentMethodToDb(method: string): string {
    const methodMap: Record<string, string> = {
      'transfer': 'bank_transfer',
      'card': 'credit_card',
      'cash': 'cash',
      'check': 'check',
      'other': 'cash'
    };
    return methodMap[method] || 'cash';
  }

  private mapDbPaymentMethodToApp(dbMethod: string): string {
    const methodMap: Record<string, string> = {
      'bank_transfer': 'transfer',
      'credit_card': 'card',
      'cash': 'cash',
      'check': 'check'
    };
    return methodMap[dbMethod] || 'cash';
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
      createdAt: data.created_at
    };
  }
}
