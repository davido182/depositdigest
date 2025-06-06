
import { supabase } from "@/integrations/supabase/client";
import { SupabaseService } from "./SupabaseService";
import { Account, AccountingEntry, TaxEntry } from "@/types";

export class SupabaseAccountingService extends SupabaseService {
  // Account methods
  async getAccounts(): Promise<Account[]> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }

    return data.map(this.mapSupabaseAccountToAccount);
  }

  async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = await this.ensureAuthenticated();
    
    const accountData = {
      user_id: user.id,
      code: account.code,
      name: account.name,
      type: account.type,
      parent_account_id: account.parentAccountId,
      is_active: account.isActive,
      description: account.description
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert(accountData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating account:', error);
      throw error;
    }

    return data.id;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const updateData: any = {};
    if (updates.code) updateData.code = updates.code;
    if (updates.name) updateData.name = updates.name;
    if (updates.type) updateData.type = updates.type;
    if (updates.parentAccountId !== undefined) updateData.parent_account_id = updates.parentAccountId;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.description !== undefined) updateData.description = updates.description;

    const { error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating account:', error);
      throw error;
    }

    return true;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting account:', error);
      throw error;
    }

    return true;
  }

  // Accounting Entry methods
  async getAccountingEntries(): Promise<AccountingEntry[]> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('accounting_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching accounting entries:', error);
      throw error;
    }

    return data.map(this.mapSupabaseAccountingEntryToAccountingEntry);
  }

  async createAccountingEntry(entry: Omit<AccountingEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = await this.ensureAuthenticated();
    
    const entryData = {
      user_id: user.id,
      date: entry.date,
      description: entry.description,
      account_id: entry.accountId,
      debit_amount: entry.debitAmount,
      credit_amount: entry.creditAmount,
      reference: entry.reference,
      notes: entry.notes
    };

    const { data, error } = await supabase
      .from('accounting_entries')
      .insert(entryData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating accounting entry:', error);
      throw error;
    }

    return data.id;
  }

  async updateAccountingEntry(id: string, updates: Partial<AccountingEntry>): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const updateData: any = {};
    if (updates.date) updateData.date = updates.date;
    if (updates.description) updateData.description = updates.description;
    if (updates.accountId) updateData.account_id = updates.accountId;
    if (updates.debitAmount !== undefined) updateData.debit_amount = updates.debitAmount;
    if (updates.creditAmount !== undefined) updateData.credit_amount = updates.creditAmount;
    if (updates.reference !== undefined) updateData.reference = updates.reference;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('accounting_entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating accounting entry:', error);
      throw error;
    }

    return true;
  }

  async deleteAccountingEntry(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('accounting_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting accounting entry:', error);
      throw error;
    }

    return true;
  }

  // Tax Entry methods
  async getTaxEntries(): Promise<TaxEntry[]> {
    const user = await this.ensureAuthenticated();
    
    const { data, error } = await supabase
      .from('tax_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching tax entries:', error);
      throw error;
    }

    return data.map(this.mapSupabaseTaxEntryToTaxEntry);
  }

  async createTaxEntry(entry: Omit<TaxEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = await this.ensureAuthenticated();
    
    const entryData = {
      user_id: user.id,
      date: entry.date,
      description: entry.description,
      tax_type: entry.taxType,
      base_amount: entry.baseAmount,
      tax_rate: entry.taxRate,
      tax_amount: entry.taxAmount,
      status: entry.status,
      due_date: entry.dueDate,
      paid_date: entry.paidDate,
      reference: entry.reference,
      notes: entry.notes
    };

    const { data, error } = await supabase
      .from('tax_entries')
      .insert(entryData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating tax entry:', error);
      throw error;
    }

    return data.id;
  }

  async updateTaxEntry(id: string, updates: Partial<TaxEntry>): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const updateData: any = {};
    if (updates.date) updateData.date = updates.date;
    if (updates.description) updateData.description = updates.description;
    if (updates.taxType) updateData.tax_type = updates.taxType;
    if (updates.baseAmount !== undefined) updateData.base_amount = updates.baseAmount;
    if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate;
    if (updates.taxAmount !== undefined) updateData.tax_amount = updates.taxAmount;
    if (updates.status) updateData.status = updates.status;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.paidDate !== undefined) updateData.paid_date = updates.paidDate;
    if (updates.reference !== undefined) updateData.reference = updates.reference;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('tax_entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating tax entry:', error);
      throw error;
    }

    return true;
  }

  async deleteTaxEntry(id: string): Promise<boolean> {
    const user = await this.ensureAuthenticated();
    
    const { error } = await supabase
      .from('tax_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting tax entry:', error);
      throw error;
    }

    return true;
  }

  // Mapping functions
  private mapSupabaseAccountToAccount(data: any): Account {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      type: data.type,
      parentAccountId: data.parent_account_id,
      isActive: data.is_active,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSupabaseAccountingEntryToAccountingEntry(data: any): AccountingEntry {
    return {
      id: data.id,
      date: data.date,
      description: data.description,
      accountId: data.account_id,
      debitAmount: data.debit_amount ? parseFloat(data.debit_amount) : undefined,
      creditAmount: data.credit_amount ? parseFloat(data.credit_amount) : undefined,
      reference: data.reference,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSupabaseTaxEntryToTaxEntry(data: any): TaxEntry {
    return {
      id: data.id,
      date: data.date,
      description: data.description,
      taxType: data.tax_type,
      baseAmount: parseFloat(data.base_amount),
      taxRate: parseFloat(data.tax_rate),
      taxAmount: parseFloat(data.tax_amount),
      status: data.status,
      dueDate: data.due_date,
      paidDate: data.paid_date,
      reference: data.reference,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
