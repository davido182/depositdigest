
import BaseService from './BaseService';
import { Payment } from '@/types';
import { mockPayments } from './mockData';
import { isDemoMode } from '../config/database';

class PaymentService extends BaseService {
  // Change from private to protected to match the parent class
  protected static instance: PaymentService;
  private localPayments: Payment[] = [];

  private constructor() {
    super();
    this.initLocalStorage();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }
  
  // Add public initLocalStorage method to match TenantService
  public initLocalStorage(force: boolean = false): void {
    if ((isDemoMode && !localStorage.getItem('payments')) || force) {
      console.log('PaymentService: Initializing localStorage with mock payments data');
      localStorage.setItem('payments', JSON.stringify(mockPayments));
      this.localPayments = [...mockPayments];
    } else if (isDemoMode) {
      try {
        const savedPayments = localStorage.getItem('payments');
        if (savedPayments) {
          this.localPayments = JSON.parse(savedPayments);
        } else {
          this.localPayments = [...mockPayments];
          localStorage.setItem('payments', JSON.stringify(this.localPayments));
        }
      } catch (error) {
        console.error('Error initializing local payments:', error);
        this.localPayments = [...mockPayments];
      }
    }
  }

  // Override simulateRequest for payment-specific mock data
  protected async simulateRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    console.log(`PaymentService: ${method} request to ${endpoint}`, data || '');
    
    if (isDemoMode) {
      // Return mock data in demo mode
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      if (endpoint === 'payments' && method === 'GET') {
        return this.localPayments as unknown as T;
      } else if (endpoint.startsWith('payments/') && method === 'GET') {
        const paymentId = endpoint.split('/')[1];
        const payment = this.localPayments.find(p => p.id === paymentId);
        return (payment || null) as unknown as T;
      } else if (endpoint === 'payments' && method === 'POST') {
        const newPayment = { ...data, id: crypto.randomUUID() };
        this.localPayments.push(newPayment);
        localStorage.setItem('payments', JSON.stringify(this.localPayments));
        return { id: newPayment.id } as unknown as T;
      } else if (endpoint.startsWith('payments/') && method === 'PUT') {
        const paymentId = endpoint.split('/')[1];
        const paymentIndex = this.localPayments.findIndex(p => p.id === paymentId);
        
        if (paymentIndex !== -1) {
          this.localPayments[paymentIndex] = { ...this.localPayments[paymentIndex], ...data };
          localStorage.setItem('payments', JSON.stringify(this.localPayments));
          return { success: true } as unknown as T;
        }
        
        throw new Error(`Payment not found: ${paymentId}`);
      } else if (endpoint.startsWith('payments/') && method === 'DELETE') {
        const paymentId = endpoint.split('/')[1];
        const initialLength = this.localPayments.length;
        this.localPayments = this.localPayments.filter(p => p.id !== paymentId);
        
        if (this.localPayments.length < initialLength) {
          localStorage.setItem('payments', JSON.stringify(this.localPayments));
          return { success: true } as unknown as T;
        }
        
        throw new Error(`Payment not found: ${paymentId}`);
      }
      
      throw new Error(`Unhandled endpoint in demo mode: ${method} ${endpoint}`);
    }
    
    return super.simulateRequest<T>(endpoint, method, data);
  }

  public async getPayments(): Promise<Payment[]> {
    return this.simulateRequest<Payment[]>('payments');
  }

  public async getPaymentById(id: string): Promise<Payment | undefined> {
    const payment = await this.simulateRequest<Payment | null>(`payments/${id}`);
    return payment || undefined;
  }

  public async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    const paymentWithDate = {
      ...payment,
      createdAt: new Date().toISOString()
    };
    const result = await this.simulateRequest<{ id: string }>('payments', 'POST', paymentWithDate);
    return result.id;
  }
  
  public async updatePayment(id: string, payment: Partial<Payment>): Promise<boolean> {
    const result = await this.simulateRequest<{ success: boolean }>(`payments/${id}`, 'PUT', payment);
    return result.success;
  }

  public async deletePayment(id: string): Promise<boolean> {
    const result = await this.simulateRequest<{ success: boolean }>(`payments/${id}`, 'DELETE');
    return result.success;
  }
}

export default PaymentService;
