
import { Account, AccountingEntry, TaxEntry } from '@/types';

class AccountingService {
  private static instance: AccountingService;
  private accounts: Account[] = [];
  private accountingEntries: AccountingEntry[] = [];
  private taxEntries: TaxEntry[] = [];

  private constructor() {
    this.clearAllData(); // Limpiar datos al inicializar
    console.log('AccountingService: Servicio inicializado sin datos');
  }

  public static getInstance(): AccountingService {
    if (!AccountingService.instance) {
      AccountingService.instance = new AccountingService();
    }
    return AccountingService.instance;
  }

  private saveDataToStorage(): void {
    // Solo guardar si hay datos reales
    if (this.accounts.length > 0) {
      localStorage.setItem('accounts', JSON.stringify(this.accounts));
    }
    if (this.accountingEntries.length > 0) {
      localStorage.setItem('accounting_entries', JSON.stringify(this.accountingEntries));
    }
    if (this.taxEntries.length > 0) {
      localStorage.setItem('tax_entries', JSON.stringify(this.taxEntries));
    }
    console.log(`AccountingService: Datos guardados`);
  }

  // Métodos para cuentas
  public async getAccounts(): Promise<Account[]> {
    return this.accounts;
  }

  public async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      ...account,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.accounts.push(newAccount);
    this.saveDataToStorage();
    return newAccount.id;
  }

  public async updateAccount(id: string, updates: Partial<Account>): Promise<boolean> {
    const index = this.accounts.findIndex(account => account.id === id);
    if (index === -1) return false;

    this.accounts[index] = {
      ...this.accounts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveDataToStorage();
    return true;
  }

  public async deleteAccount(id: string): Promise<boolean> {
    const index = this.accounts.findIndex(account => account.id === id);
    if (index === -1) return false;

    this.accounts.splice(index, 1);
    this.saveDataToStorage();
    return true;
  }

  // Métodos para entradas contables
  public async getAccountingEntries(): Promise<AccountingEntry[]> {
    return this.accountingEntries;
  }

  public async createAccountingEntry(entry: Omit<AccountingEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newEntry: AccountingEntry = {
      id: `entry-${Date.now()}`,
      ...entry,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.accountingEntries.push(newEntry);
    this.saveDataToStorage();
    return newEntry.id;
  }

  public async updateAccountingEntry(id: string, updates: Partial<AccountingEntry>): Promise<boolean> {
    const index = this.accountingEntries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.accountingEntries[index] = {
      ...this.accountingEntries[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveDataToStorage();
    return true;
  }

  public async deleteAccountingEntry(id: string): Promise<boolean> {
    const index = this.accountingEntries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.accountingEntries.splice(index, 1);
    this.saveDataToStorage();
    return true;
  }

  // Métodos para entradas fiscales
  public async getTaxEntries(): Promise<TaxEntry[]> {
    return this.taxEntries;
  }

  public async createTaxEntry(entry: Omit<TaxEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newEntry: TaxEntry = {
      id: `tax-${Date.now()}`,
      ...entry,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.taxEntries.push(newEntry);
    this.saveDataToStorage();
    return newEntry.id;
  }

  public async updateTaxEntry(id: string, updates: Partial<TaxEntry>): Promise<boolean> {
    const index = this.taxEntries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.taxEntries[index] = {
      ...this.taxEntries[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveDataToStorage();
    return true;
  }

  public async deleteTaxEntry(id: string): Promise<boolean> {
    const index = this.taxEntries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.taxEntries.splice(index, 1);
    this.saveDataToStorage();
    return true;
  }

  public clearAllData(): void {
    console.log('AccountingService: Limpiando todos los datos');
    this.accounts = [];
    this.accountingEntries = [];
    this.taxEntries = [];
    localStorage.removeItem('accounts');
    localStorage.removeItem('accounting_entries');
    localStorage.removeItem('tax_entries');
  }
}

export default AccountingService;
