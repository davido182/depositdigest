/**
 * Tipos híbridos de base de datos
 * 
 * Este archivo proporciona tipos que soportan AMBOS formatos:
 * - Nombres de Supabase (snake_case)
 * - Nombres del código existente (camelCase)
 * 
 * Esto permite una migración gradual sin romper nada.
 */

import { Tables } from '@/integrations/supabase/types';

// ============================================================================
// TENANT (Inquilino)
// ============================================================================

/**
 * Tipo base de Supabase para tenants
 */
type SupabaseTenant = Tables<'tenants'>;

/**
 * Tipo híbrido que soporta ambos formatos
 * Incluye aliases para compatibilidad con código existente
 */
export type Tenant = SupabaseTenant & {
  // Aliases para compatibilidad (camelCase)
  moveInDate?: string;        // alias de lease_start_date o move_in_date
  leaseEndDate?: string;      // alias de lease_end_date
  rentAmount?: number;        // alias de monthly_rent
  unit?: string;              // alias de unit_number
  propertyName?: string;      // alias de property_name
  depositAmount?: number;     // alias de deposit_paid
  
  // Campos adicionales que pueden no estar en Supabase types
  paymentHistory?: any[];
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Normaliza un tenant desde cualquier formato a nuestro tipo híbrido
 * Asegura que existan AMBAS versiones de cada campo
 */
export function normalizeTenant(tenant: any): Tenant {
  if (!tenant) return tenant;
  
  // Nombre completo
  const fullName = tenant.name || 
                   (tenant.first_name && tenant.last_name 
                     ? `${tenant.first_name} ${tenant.last_name}`.trim() 
                     : tenant.first_name || '');
  
  return {
    ...tenant,
    
    // Nombre
    name: fullName,
    first_name: tenant.first_name || fullName.split(' ')[0] || '',
    last_name: tenant.last_name || fullName.split(' ').slice(1).join(' ') || '',
    
    // Fecha de inicio (soporta 3 formatos)
    lease_start_date: tenant.lease_start_date || tenant.move_in_date || tenant.moveindate || null,
    move_in_date: tenant.move_in_date || tenant.lease_start_date || tenant.moveindate || null,
    moveInDate: tenant.moveInDate || tenant.lease_start_date || tenant.move_in_date || tenant.moveindate || '',
    
    // Fecha de fin (soporta 2 formatos)
    lease_end_date: tenant.lease_end_date || tenant.leaseenddate || null,
    leaseEndDate: tenant.leaseEndDate || tenant.lease_end_date || tenant.leaseenddate || '',
    
    // Renta (soporta 2 formatos)
    monthly_rent: tenant.monthly_rent || tenant.rent_amount || 0,
    rent_amount: tenant.rent_amount || tenant.monthly_rent || 0,
    rentAmount: tenant.rentAmount || tenant.monthly_rent || tenant.rent_amount || 0,
    
    // Unidad
    unit_number: tenant.unit_number || tenant.unit || '',
    unit: tenant.unit || tenant.unit_number || '',
    
    // Depósito (soporta 2 formatos)
    deposit_paid: tenant.deposit_paid || tenant.depositamount || 0,
    depositAmount: tenant.depositAmount || tenant.deposit_paid || tenant.depositamount || 0,
    
    // Propiedad
    property_name: tenant.property_name || tenant.propertyName || null,
    propertyName: tenant.propertyName || tenant.property_name || '',
    
    // Status
    status: tenant.status || tenant.is_active === false ? 'inactive' : 'active',
    is_active: tenant.is_active !== undefined ? tenant.is_active : tenant.status !== 'inactive',
    
    // Timestamps
    createdAt: tenant.createdAt || tenant.created_at || new Date().toISOString(),
    updatedAt: tenant.updatedAt || tenant.updated_at || new Date().toISOString(),
    created_at: tenant.created_at || tenant.createdAt || new Date().toISOString(),
    updated_at: tenant.updated_at || tenant.updatedAt || new Date().toISOString(),
  };
}

/**
 * Prepara un tenant para insertar en Supabase
 * Convierte de formato híbrido a formato Supabase
 */
export function tenantToSupabase(tenant: Partial<Tenant>): any {
  // Nombre completo
  const fullName = tenant.name || '';
  
  return {
    // IDs
    user_id: tenant.user_id || '',
    landlord_id: tenant.landlord_id || '',
    property_id: tenant.property_id || null,
    
    // Nombre
    name: fullName || null,
    
    // Contacto
    email: tenant.email || '',
    phone: tenant.phone || null,
    
    // Fechas
    lease_start_date: tenant.lease_start_date || tenant.moveInDate || new Date().toISOString().split('T')[0],
    lease_end_date: tenant.lease_end_date || tenant.leaseEndDate || null,
    
    // Financiero
    rent_amount: tenant.rent_amount || tenant.rentAmount || 0,
    
    // Unidad y propiedad
    unit_number: tenant.unit_number || tenant.unit || '',
    property_name: tenant.property_name || tenant.propertyName || null,
    
    // Status
    status: tenant.status || 'active',
  };
}

// ============================================================================
// PROPERTY (Propiedad)
// ============================================================================

export type Property = Tables<'properties'> & {
  // Aliases para compatibilidad
  units?: number;              // alias de total_units
  occupied_units?: number;     // calculado
  monthly_revenue?: number;    // calculado
};

export function normalizeProperty(property: any): Property {
  if (!property) return property;
  
  return {
    ...property,
    units: property.units || property.total_units || 0,
    total_units: property.total_units || property.units || 0,
  };
}

// ============================================================================
// UNIT (Unidad)
// ============================================================================

export type Unit = Tables<'units'> & {
  // Aliases para compatibilidad
  monthly_rent?: number;       // alias de rent_amount
  rentAmount?: number;         // alias de rent_amount
  isAvailable?: boolean;       // alias de is_available
};

export function normalizeUnit(unit: any): Unit {
  if (!unit) return unit;
  
  // Real DB column is monthly_rent. rent_amount is just an alias.
  const rent = unit.monthly_rent ?? unit.rent_amount ?? unit.rentAmount ?? 0;
  
  return {
    ...unit,
    monthly_rent: rent,
    rent_amount: rent,   // alias for code compatibility
    rentAmount: rent,    // alias for code compatibility
    
    // Disponibilidad
    is_available: unit.is_available !== undefined ? unit.is_available : true,
    isAvailable: unit.isAvailable !== undefined ? unit.isAvailable : unit.is_available !== false,
  };
}

/**
 * Prepara una unidad para insertar en Supabase
 * Uses real DB columns: monthly_rent, is_available, tenant_id
 */
export function unitToSupabase(unit: Partial<Unit>): any {
  return {
    property_id: unit.property_id || '',
    unit_number: unit.unit_number || '',
    monthly_rent: unit.monthly_rent ?? (unit as any).rent_amount ?? (unit as any).rentAmount ?? 0,
    is_available: unit.is_available !== undefined ? unit.is_available : true,
    tenant_id: unit.tenant_id || null,
  };
}

// ============================================================================
// PAYMENT (Pago)
// ============================================================================

export type Payment = Tables<'payments'> & {
  // Aliases para compatibilidad
  paymentDate?: string;        // alias de payment_date
  paymentMethod?: string;      // alias de payment_method
};

export function normalizePayment(payment: any): Payment {
  if (!payment) return payment;
  
  return {
    ...payment,
    payment_date: payment.payment_date || payment.paymentDate || new Date().toISOString().split('T')[0],
    paymentDate: payment.paymentDate || payment.payment_date || '',
    payment_method: payment.payment_method || payment.paymentMethod || 'cash',
    paymentMethod: payment.paymentMethod || payment.payment_method || 'cash',
  };
}

// ============================================================================
// HELPERS GENERALES
// ============================================================================

/**
 * Normaliza un array de cualquier tipo
 */
export function normalizeArray<T>(
  items: any[], 
  normalizer: (item: any) => T
): T[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizer);
}

/**
 * Convierte fecha de cualquier formato a ISO (YYYY-MM-DD)
 */
export function toISODate(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Convierte número a formato seguro
 */
export function toNumber(value: any, defaultValue: number = 0): number {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Convierte string a string seguro (nunca undefined)
 */
export function toString(value: any, defaultValue: string = ''): string {
  return value !== undefined && value !== null ? String(value) : defaultValue;
}
