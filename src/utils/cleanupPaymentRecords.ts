/**
 * Utility to clean up orphaned payment records
 * (records that belong to deleted tenants)
 */

interface PaymentRecord {
  tenantId: string;
  year: number;
  month: number;
  paid: boolean;
  amount?: number;
}

interface Tenant {
  id: string;
  name: string;
  status: string;
}

/**
 * Remove payment records for tenants that no longer exist
 */
export function cleanupOrphanedPaymentRecords(
  paymentRecords: PaymentRecord[],
  activeTenants: Tenant[]
): PaymentRecord[] {
  const activeTenantIds = new Set(activeTenants.map(t => t.id));
  
  const validRecords = paymentRecords.filter(record => 
    activeTenantIds.has(record.tenantId)
  );
  
  const orphanedCount = paymentRecords.length - validRecords.length;
  
  if (orphanedCount > 0) {
    console.log(`🧹 Cleaned up ${orphanedCount} orphaned payment records`);
  }
  
  return validRecords;
}

/**
 * Save cleaned records back to localStorage
 */
export function saveCleanedRecords(
  userId: string,
  year: number,
  cleanedRecords: PaymentRecord[]
): void {
  const storageKey = `payment_records_${userId}_${year}`;
  localStorage.setItem(storageKey, JSON.stringify(cleanedRecords));
  console.log(`✅ Saved ${cleanedRecords.length} valid payment records`);
}

/**
 * Get tenant name by ID (for debugging)
 */
export function getTenantNameById(
  tenantId: string,
  tenants: Tenant[]
): string {
  const tenant = tenants.find(t => t.id === tenantId);
  return tenant?.name || 'Unknown (deleted)';
}
