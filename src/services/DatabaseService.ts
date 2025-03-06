
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';
import { Tenant, Payment } from '@/types';

class DatabaseService {
  private static instance: DatabaseService;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Test database connection
  public async testConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      connection.release();
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // Tenant methods
  public async getTenants(): Promise<Tenant[]> {
    try {
      const [rows] = await this.pool.query('SELECT * FROM tenants');
      return rows as Tenant[];
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw error;
    }
  }

  public async getTenantById(id: string): Promise<Tenant | null> {
    try {
      const [rows] = await this.pool.query('SELECT * FROM tenants WHERE id = ?', [id]);
      const tenants = rows as Tenant[];
      return tenants.length > 0 ? tenants[0] : null;
    } catch (error) {
      console.error(`Error fetching tenant with id ${id}:`, error);
      throw error;
    }
  }

  public async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      await this.pool.query(
        `INSERT INTO tenants 
        (id, name, email, phone, unit, moveInDate, leaseEndDate, rentAmount, depositAmount, status, notes, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, tenant.name, tenant.email, tenant.phone, tenant.unit, 
          tenant.moveInDate, tenant.leaseEndDate, tenant.rentAmount, 
          tenant.depositAmount, tenant.status, tenant.notes, now, now]
      );
      
      return id;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  public async updateTenant(id: string, tenant: Partial<Tenant>): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      // Build the dynamic part of the query
      const updateFields: string[] = [];
      const values: any[] = [];
      
      Object.entries(tenant).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'createdAt') {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      updateFields.push('updatedAt = ?');
      values.push(now);
      
      // Add the ID at the end for the WHERE clause
      values.push(id);
      
      const query = `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`;
      const [result] = await this.pool.query(query, values);
      
      return (result as mysql.ResultSetHeader).affectedRows > 0;
    } catch (error) {
      console.error(`Error updating tenant with id ${id}:`, error);
      throw error;
    }
  }

  // Payment methods
  public async getPayments(): Promise<Payment[]> {
    try {
      const [rows] = await this.pool.query('SELECT * FROM payments');
      return rows as Payment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  public async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      await this.pool.query(
        `INSERT INTO payments 
        (id, tenantId, amount, date, type, method, status, notes, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, payment.tenantId, payment.amount, payment.date, 
          payment.type, payment.method, payment.status, payment.notes, now]
      );
      
      return id;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }
}

export default DatabaseService;
