
import { dbConfig, isDemoMode } from '../config/database';

class BaseService {
  protected static instance: BaseService;
  protected apiUrl: string;

  protected constructor() {
    this.apiUrl = dbConfig.apiUrl;
    console.log(`Service initialized with API URL: ${this.apiUrl}`);
  }

  // Test connection
  public async testConnection(): Promise<boolean> {
    try {
      // In a real app, we would test the API connection here
      console.log('Testing API connection to:', this.apiUrl);
      // For demo purposes, we'll just return true
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  // Simulate API request with mock data or fetch
  protected async simulateRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    console.log(`${method} request to ${endpoint}`, data || '');
    
    if (isDemoMode) {
      // Return mock data in demo mode
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      return null as T; // This will be overridden by child classes
    } else {
      // In a real application, we would make actual API calls here
      try {
        const response = await fetch(`${this.apiUrl}/${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    }
  }
}

export default BaseService;
