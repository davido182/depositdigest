import { supabase } from '@/integrations/supabase/client';

export interface PaymentRecord {
  id?: string;
  landlord_id: string;
  tenant_id: string;
  year: number;
  month: number;
  paid: boolean;
  amount?: number;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
}

class PaymentRecordService {
  /**
   * Get all payment records for a specific year
   */
  async getPaymentRecords(landlordId: string, year: number): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .eq('landlord_id', landlordId)
        .eq('year', year)
        .order('month', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment records:', error);
      throw error;
    }
  }

  /**
   * Upsert (insert or update) a payment record
   */
  async upsertPaymentRecord(record: PaymentRecord): Promise<PaymentRecord> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .upsert(
          {
            landlord_id: record.landlord_id,
            tenant_id: record.tenant_id,
            year: record.year,
            month: record.month,
            paid: record.paid,
            amount: record.amount || 0,
            payment_date: record.payment_date || null,
          },
          {
            onConflict: 'tenant_id,year,month',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting payment record:', error);
      throw error;
    }
  }

  /**
   * Bulk upsert multiple payment records
   */
  async bulkUpsertPaymentRecords(records: PaymentRecord[]): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .upsert(
          records.map(r => ({
            landlord_id: r.landlord_id,
            tenant_id: r.tenant_id,
            year: r.year,
            month: r.month,
            paid: r.paid,
            amount: r.amount || 0,
            payment_date: r.payment_date || null,
          })),
          {
            onConflict: 'tenant_id,year,month',
          }
        )
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk upserting payment records:', error);
      throw error;
    }
  }

  /**
   * Delete a payment record
   */
  async deletePaymentRecord(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting payment record:', error);
      throw error;
    }
  }

  /**
   * Migrate data from localStorage to Supabase
   */
  async migrateFromLocalStorage(landlordId: string, year: number): Promise<void> {
    try {
      const storageKey = `payment_records_${landlordId}_${year}`;
      const storedData = localStorage.getItem(storageKey);

      if (!storedData) {
        console.log('No localStorage data to migrate');
        return;
      }

      const localRecords = JSON.parse(storedData);
      console.log(`Migrating ${localRecords.length} records from localStorage to Supabase`);

      // Convert localStorage format to Supabase format
      const recordsToMigrate: PaymentRecord[] = localRecords.map((r: any) => ({
        landlord_id: landlordId,
        tenant_id: r.tenantId,
        year: r.year,
        month: r.month,
        paid: r.paid,
        amount: r.amount || 0,
        payment_date: r.paymentDate || null,
      }));

      // Bulk insert
      await this.bulkUpsertPaymentRecords(recordsToMigrate);

      console.log('Migration completed successfully');
      
      // Keep localStorage as backup for now
      // localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      throw error;
    }
  }
}

export const paymentRecordService = new PaymentRecordService();
