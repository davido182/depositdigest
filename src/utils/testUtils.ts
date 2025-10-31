// Utilidades para testing - RentaFlux
import { config } from './config';

export const testData = {
  // Datos de prueba para desarrollo y staging
  landlord: {
    email: 'landlord@rentaflux.com',
    password: 'Test123!',
    name: 'Propietario Demo',
  },
  
  tenant: {
    email: 'tenant@rentaflux.com',
    password: 'Test123!',
    name: 'Inquilino Demo',
    unitNumber: 'A-101',
    rentAmount: 1200,
  },
  
  property: {
    name: 'Edificio Demo',
    address: 'Calle Principal 123, Madrid',
    units: 10,
  },
  
  payment: {
    amount: 1200,
    method: 'transfer',
    description: 'Pago de alquiler - Enero 2025',
  },
};

export const createTestUser = async (type: 'landlord' | 'tenant') => {
  if (config.app.environment === 'production') {
    throw new Error('Test users cannot be created in production');
  }
  
  const userData = testData[type];
  // Removed console.log for security
  
  // Aquí implementarías la lógica para crear usuarios de prueba
  return userData;
};

export const seedTestData = async () => {
  if (config.app.environment === 'production') {
    console.warn('Test data seeding is disabled in production');
    return;
  }
  
  // Removed console.log for security
  
  try {
    // Crear usuarios de prueba
    await createTestUser('landlord');
    await createTestUser('tenant');
    
    // Removed console.log for security
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  }
};

export const clearTestData = async () => {
  if (config.app.environment === 'production') {
    throw new Error('Test data cannot be cleared in production');
  }
  
  // Removed console.log for security
  // Implementar lógica de limpieza
};
