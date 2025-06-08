
import BaseService from './BaseService';
import { Account, AccountingEntry, TaxEntry } from '@/types';
import { isDemoMode } from '../config/database';

// Mock data for demo mode
const mockAccounts: Account[] = [
  {
    id: '1',
    code: '1000',
    name: 'Cash',
    type: 'asset',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    code: '1100',
    name: 'Accounts Receivable',
    type: 'asset',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    code: '2000',
    name: 'Accounts Payable',
    type: 'liability',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    code: '3000',
    name: 'Owner Equity',
    type: 'equity',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    code: '4000',
    name: 'Rental Income',
    type: 'income',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    code: '5000',
    name: 'Maintenance Expenses',
    type: 'expense',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockAccountingEntries: AccountingEntry[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    description: 'Rent collection - Unit 101',
    accountId: '5',
    creditAmount: 1200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    description: 'Maintenance repair - Unit 102',
    accountId: '6',
    debitAmount: 150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockTaxEntries: TaxEntry[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    description: 'Municipal tax Q1',
    taxType: 'municipal_tax',
    baseAmount: 5000,
    taxRate: 0.1,
    taxAmount: 500,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class AccountingService extends BaseService {
  protected static instance: AccountingService;
  private localAccounts: Account[] = [];
  private localAccountingEntries: AccountingEntry[] = [];
  private localTaxEntries: TaxEntry[] = [];

  private constructor() {
    super();
    this.initLocalStorage();
  }

  public static getInstance(): AccountingService {
    if (!AccountingService.instance) {
      AccountingService.instance = new AccountingService();
    }
    return AccountingService.instance;
  }

  public initLocalStorage(force: boolean = false): void {
    if ((isDemoMode && !localStorage.getItem('accounts')) || force) {
      console.log('AccountingService: Initializing localStorage with mock data');
      localStorage.setItem('accounts', JSON.stringify(mockAccounts));
      localStorage.setItem('accountingEntries', JSON.stringify(mockAccountingEntries));
      localStorage.setItem('taxEntries', JSON.stringify(mockTaxEntries));
      this.localAccounts = [...mockAccounts];
      this.localAccountingEntries = [...mockAccountingEntries];
      this.localTaxEntries = [...mockTaxEntries];
    } else if (isDemoMode) {
      try {
        const savedAccounts = localStorage.getItem('accounts');
        const savedEntries = localStorage.getItem('accountingEntries');
        const savedTaxEntries = localStorage.getItem('taxEntries');
        
        this.localAccounts = savedAccounts ? JSON.parse(savedAccounts) : [...mockAccounts];
        this.localAccountingEntries = savedEntries ? JSON.parse(savedEntries) : [...mockAccountingEntries];
        this.localTaxEntries = savedTaxEntries ? JSON.parse(savedTaxEntries) : [...mockTaxEntries];
        
        if (!savedAccounts) localStorage.setItem('accounts', JSON.stringify(this.localAccounts));
        if (!savedEntries) localStorage.setItem('accountingEntries', JSON.stringify(this.localAccountingEntries));
        if (!savedTaxEntries) localStorage.setItem('taxEntries', JSON.stringify(this.localTaxEntries));
      } catch (error) {
        console.error('Error initializing local accounting data:', error);
        this.localAccounts = [...mockAccounts];
        this.localAccountingEntries = [...mockAccountingEntries];
        this.localTaxEntries = [...mockTaxEntries];
      }
    }
  }

  // Account methods
  public async getAccounts(): Promise<Account[]> {
    if (isDemoMode) {
      return Promise.resolve(this.localAccounts);
    }
    return this.simulateRequest<Account[]>('accounts');
  }

  public async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (isDemoMode) {
      const newAccount: Account = {
        ...account,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.localAccounts.push(newAccount);
      localStorage.setItem('accounts', JSON.stringify(this.localAccounts));
      return Promise.resolve(newAccount.id);
    }
    const result = await this.simulateRequest<{ id: string }>('accounts', 'POST', account);
    return result.id;
  }

  public async updateAccount(id: string, updates: Partial<Account>): Promise<boolean> {
    if (isDemoMode) {
      const index = this.localAccounts.findIndex(a => a.id === id);
      if (index !== -1) {
        this.localAccounts[index] = {
          ...this.localAccounts[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('accounts', JSON.stringify(this.localAccounts));
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }
    return this.simulateRequest<boolean>(`accounts/${id}`, 'PUT', updates);
  }

  public async deleteAccount(id: string): Promise<boolean> {
    if (isDemoMode) {
      const initialLength = this.localAccounts.length;
      this.localAccounts = this.localAccounts.filter(a => a.id !== id);
      if (this.localAccounts.length < initialLength) {
        localStorage.setItem('accounts', JSON.stringify(this.localAccounts));
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }
    return this.simulateRequest<boolean>(`accounts/${id}`, 'DELETE');
  }

  // Accounting Entry methods
  public async getAccountingEntries(): Promise<AccountingEntry[]> {
    if (isDemoMode) {
      return Promise.resolve(this.localAccountingEntries);
    }
    return this.simulateRequest<AccountingEntry[]>('accounting-entries');
  }

  public async createAccountingEntry(entry: Omit<AccountingEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (isDemoMode) {
      const newEntry: AccountingEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.localAccountingEntries.push(newEntry);
      localStorage.setItem('accountingEntries', JSON.stringify(this.localAccountingEntries));
      return Promise.resolve(newEntry.id);
    }
    const result = await this.simulateRequest<{ id: string }>('accounting-entries', 'POST', entry);
    return result.id;
  }

  public async updateAccountingEntry(id: string, updates: Partial<AccountingEntry>): Promise<boolean> {
    if (isDemoMode) {
      const index = this.localAccountingEntries.findIndex(e => e.id === id);
      if (index !== -1) {
        this.localAccountingEntries[index] = {
          ...this.localAccountingEntries[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('accountingEntries', JSON.stringify(this.localAccountingEntries));
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }
    return this.simulateRequest<boolean>(`accounting-entries/${id}`, 'PUT', updates);
  }

  public async deleteAccountingEntry(id: string): Promise<boolean> {
    if (isDemoMode) {
      const initialLength = this.localAccountingEntries.length;
      this.localAccountingEntries = this.localAccountingEntries.filter(e => e.id !== id);
      if (this.localAccountingEntries.length < initialLength) {
        localStorage.setItem('accountingEntries', JSON.stringify(this.localAccountingEntries));
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }
    return this.simulateRequest<boolean>(`accounting-entries/${id}`, 'DELETE');
  }

  // Tax Entry methods
  public async getTaxEntries(): Promise<TaxEntry[]> {
    if (isDemoMode) {
      return Promise.resolve(this.localTaxEntries);
    }
    return this.simulateRequest<TaxEntry[]>('tax-entries');
  }

  public async createTaxEntry(entry: Omit<TaxEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (isDemoMode) {
      const newEntry: TaxEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.localTaxEntries.push(newEntry);
      localStorage.setItem('taxEntries', JSON.stringify(this.localTaxEntries));
      return Promise.resolve(newEntry.id);
    }
    const result = await this.simulateRequest<{ id: string }>('tax-entries', 'POST', entry);
    return result.id;
  }

  public async updateTaxEntry(id: string, updates: Partial<TaxEntry>): Promise<boolean> {
    if (isDemoMode) {
      const index = this.localTaxEntries.findIndex(e => e.id === id);
      if (index !== -1) {
        this.localTaxEntries[index] = {
          ...this.localTaxEntries[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('taxEntries', JSON.stringify(this.localTaxEntries));
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }
    return this.simulateRequest<boolean>(`tax-entries/${id}`, 'PUT', updates);
  }

  public async deleteTaxEntry(id: string): Promise<boolean> {
    if (isDemoMode) {
      const initialLength = this.localTaxEntries.length;
      this.localTaxEntries = this.localTaxEntries.filter(e => e.id !== id);
      if (this.localTaxEntries.length < initialLength) {
        localStorage.setItem('taxEntries', JSON.stringify(this.localTaxEntries));
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }
    return this.simulateRequest<boolean>(`tax-entries/${id}`, 'DELETE');
  }
}

export default AccountingService;
