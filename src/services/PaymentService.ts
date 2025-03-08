
import BaseService from './BaseService';
import { Payment } from '@/types';
import { mockPayments } from './mockData';
import { isDemoMode } from '../config/database';

class PaymentService extends BaseService {
  private static instance: PaymentService;

  private constructor() {
    super();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
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
        return mockPayments as unknown as T;
      } else if (endpoint === 'payments' && method === 'POST') {
        return { id: crypto.randomUUID() } as unknown as T;
      }
      
      throw new Error(`Unhandled endpoint in demo mode: ${method} ${endpoint}`);
    }
    
    return super.simulateRequest<T>(endpoint, method, data);
  }

  public async getPayments(): Promise<Payment[]> {
    return this.simulateRequest<Payment[]>('payments');
  }

  public async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    const result = await this.simulateRequest<{ id: string }>('payments', 'POST', payment);
    return result.id;
  }
}

export default PaymentService;
