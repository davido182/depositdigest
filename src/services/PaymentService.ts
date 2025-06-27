
import BaseService from './BaseService';
import { Payment } from '@/types';
import { mockPayments } from './mockData';
import { isDemoMode } from '../config/database';

class PaymentService extends BaseService {
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
  
  public initLocalStorage(force: boolean = false): void {
    // Solo inicializar con datos de demostración si se fuerza explícitamente o si no existen datos
    const existingPayments = localStorage.getItem('payments');
    
    if (force && isDemoMode) {
      console.log('PaymentService: Inicializando localStorage forzadamente con datos de demostración de pagos');
      localStorage.setItem('payments', JSON.stringify(mockPayments));
      this.localPayments = [...mockPayments];
    } else if (!existingPayments) {
      console.log('PaymentService: No hay datos existentes, comenzando con pagos vacíos');
      this.localPayments = [];
      localStorage.setItem('payments', JSON.stringify([]));
    } else {
      try {
        const savedPayments = localStorage.getItem('payments');
        if (savedPayments) {
          this.localPayments = JSON.parse(savedPayments);
        } else {
          this.localPayments = [];
        }
      } catch (error) {
        console.error('Error al analizar datos de pagos:', error);
        this.localPayments = [];
        localStorage.setItem('payments', JSON.stringify([]));
      }
    }
  }

  // Anular simulateRequest para datos específicos de pagos de demostración
  protected async simulateRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    console.log(`PaymentService: ${method} solicitud a ${endpoint}`, data || '');
    
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
        
        throw new Error(`Pago no encontrado: ${paymentId}`);
      } else if (endpoint.startsWith('payments/') && method === 'DELETE') {
        const paymentId = endpoint.split('/')[1];
        const initialLength = this.localPayments.length;
        this.localPayments = this.localPayments.filter(p => p.id !== paymentId);
        
        if (this.localPayments.length < initialLength) {
          localStorage.setItem('payments', JSON.stringify(this.localPayments));
          return { success: true } as unknown as T;
        }
        
        throw new Error(`Pago no encontrado: ${paymentId}`);
      }
      
      throw new Error(`Endpoint no manejado en modo de demostración: ${method} ${endpoint}`);
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

  public clearAllData(): void {
    console.log('PaymentService: Eliminando todos los datos de pagos');
    this.localPayments = [];
    localStorage.removeItem('payments');
  }
}

export default PaymentService;
