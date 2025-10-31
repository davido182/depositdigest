import { supabase } from "@/integrations/supabase/client";

export interface DataInconsistency {
  id: string;
  type: 'rent_mismatch' | 'unit_assignment' | 'missing_data' | 'duplicate_assignment';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedEntities: {
    tenant?: any;
    unit?: any;
    property?: any;
  };
  suggestedFix: {
    action: string;
    description: string;
    autoFixable: boolean;
  };
  detectedAt: Date;
}

export class DataConsistencyService {
  private static instance: DataConsistencyService;

  private constructor() {}

  public static getInstance(): DataConsistencyService {
    if (!DataConsistencyService.instance) {
      DataConsistencyService.instance = new DataConsistencyService();
    }
    return DataConsistencyService.instance;
  }

  async checkAllInconsistencies(userId: string): Promise<DataInconsistency[]> {
    const inconsistencies: DataInconsistency[] = [];

    try {
      // Get all user data
      const [tenantsResult, unitsResult] = await Promise.all([
        this.getTenants(userId),
        this.getUnits(userId)
      ]);

      // Check rent mismatches
      const rentInconsistencies = this.checkRentMismatches(tenantsResult, unitsResult);
      inconsistencies.push(...rentInconsistencies);

      // Check unit assignment issues
      const assignmentInconsistencies = this.checkUnitAssignments(tenantsResult, unitsResult);
      inconsistencies.push(...assignmentInconsistencies);

      // Check missing data
      const missingDataInconsistencies = this.checkMissingData(tenantsResult, unitsResult);
      inconsistencies.push(...missingDataInconsistencies);

      // Check duplicate assignments
      const duplicateInconsistencies = this.checkDuplicateAssignments(tenantsResult, unitsResult);
      inconsistencies.push(...duplicateInconsistencies);

    } catch (error) {
      console.error('Error checking data consistency:', error);
    }

    return inconsistencies.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private async getTenants(userId: string) {
    const { tenantService } = await import('@/services/TenantService');
    return await tenantService.getTenants();
  }

  private async getUnits(userId: string) {
    const { data, error } = await supabase
      .from('units')
      .select(`
        id,
        unit_number,
        monthly_rent,
        tenant_id,
        property_id,
        is_available,
        properties!inner(name, landlord_id)
      `)
      .eq('properties.landlord_id', userId);

    if (error) throw error;
    return data || [];
  }

  private checkRentMismatches(tenants: any[], units: any[]): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];

    tenants.forEach(tenant => {
      if (tenant.unit && tenant.unit !== 'Sin unidad') {
        const unit = units.find(u => u.unit_number === tenant.unit);
        
        if (unit) {
          const tenantRent = tenant.rentAmount || 0;
          const unitRent = unit.monthly_rent || 0;
          const difference = Math.abs(tenantRent - unitRent);
          
          if (difference > 1) {
            inconsistencies.push({
              id: `rent_mismatch_${tenant.id}_${unit.id}`,
              type: 'rent_mismatch',
              severity: difference > 100 ? 'high' : difference > 50 ? 'medium' : 'low',
              title: 'Diferencia de Renta',
              description: `${tenant.name} (€${tenantRent}) vs Unidad ${unit.unit_number} (€${unitRent})`,
              affectedEntities: {
                tenant: {
                  id: tenant.id,
                  name: tenant.name,
                  rent: tenantRent,
                  unit: tenant.unit
                },
                unit: {
                  id: unit.id,
                  number: unit.unit_number,
                  rent: unitRent,
                  property: unit.properties?.name
                }
              },
              suggestedFix: {
                action: tenantRent > unitRent ? 'update_unit_rent' : 'update_tenant_rent',
                description: tenantRent > unitRent ? 
                  `Actualizar renta de unidad a €${tenantRent}` : 
                  `Actualizar renta de inquilino a €${unitRent}`,
                autoFixable: true
              },
              detectedAt: new Date()
            });
          }
        }
      }
    });

    return inconsistencies;
  }

  private checkUnitAssignments(tenants: any[], units: any[]): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];

    tenants.forEach(tenant => {
      if (tenant.unit && tenant.unit !== 'Sin unidad') {
        const unit = units.find(u => u.unit_number === tenant.unit);
        
        if (!unit) {
          inconsistencies.push({
            id: `missing_unit_${tenant.id}`,
            type: 'unit_assignment',
            severity: 'medium',
            title: 'Unidad No Encontrada',
            description: `${tenant.name} asignado a unidad inexistente: ${tenant.unit}`,
            affectedEntities: {
              tenant: {
                id: tenant.id,
                name: tenant.name,
                unit: tenant.unit
              }
            },
            suggestedFix: {
              action: 'fix_unit_assignment',
              description: 'Corregir asignación de unidad o crear unidad faltante',
              autoFixable: false
            },
            detectedAt: new Date()
          });
        }
      }
    });

    return inconsistencies;
  }

  private checkMissingData(tenants: any[], units: any[]): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];

    tenants.forEach(tenant => {
      // Check missing rent
      if (!tenant.rentAmount || tenant.rentAmount === 0) {
        inconsistencies.push({
          id: `missing_rent_${tenant.id}`,
          type: 'missing_data',
          severity: 'medium',
          title: 'Renta No Definida',
          description: `${tenant.name} no tiene monto de renta`,
          affectedEntities: {
            tenant: {
              id: tenant.id,
              name: tenant.name,
              rent: tenant.rentAmount
            }
          },
          suggestedFix: {
            action: 'set_rent_amount',
            description: 'Definir monto de renta para el inquilino',
            autoFixable: false
          },
          detectedAt: new Date()
        });
      }

      // Check missing unit assignment
      if (!tenant.unit || tenant.unit === 'Sin unidad') {
        inconsistencies.push({
          id: `missing_unit_assignment_${tenant.id}`,
          type: 'missing_data',
          severity: 'low',
          title: 'Sin Unidad Asignada',
          description: `${tenant.name} no tiene unidad asignada`,
          affectedEntities: {
            tenant: {
              id: tenant.id,
              name: tenant.name,
              unit: tenant.unit
            }
          },
          suggestedFix: {
            action: 'assign_unit',
            description: 'Asignar unidad al inquilino',
            autoFixable: false
          },
          detectedAt: new Date()
        });
      }
    });

    return inconsistencies;
  }

  private checkDuplicateAssignments(tenants: any[], units: any[]): DataInconsistency[] {
    const inconsistencies: DataInconsistency[] = [];
    const unitAssignments = new Map<string, any[]>();

    // Group tenants by unit
    tenants.forEach(tenant => {
      if (tenant.unit && tenant.unit !== 'Sin unidad') {
        if (!unitAssignments.has(tenant.unit)) {
          unitAssignments.set(tenant.unit, []);
        }
        unitAssignments.get(tenant.unit)!.push(tenant);
      }
    });

    // Check for duplicates
    unitAssignments.forEach((assignedTenants, unitNumber) => {
      if (assignedTenants.length > 1) {
        inconsistencies.push({
          id: `duplicate_assignment_${unitNumber}`,
          type: 'duplicate_assignment',
          severity: 'high',
          title: 'Asignación Duplicada',
          description: `Unidad ${unitNumber} asignada a ${assignedTenants.length} inquilinos`,
          affectedEntities: {
            unit: {
              number: unitNumber,
              tenants: assignedTenants.map(t => ({ id: t.id, name: t.name }))
            }
          },
          suggestedFix: {
            action: 'resolve_duplicate_assignment',
            description: 'Resolver conflicto de asignación múltiple',
            autoFixable: false
          },
          detectedAt: new Date()
        });
      }
    });

    return inconsistencies;
  }

  async autoFixInconsistency(inconsistency: DataInconsistency): Promise<boolean> {
    if (!inconsistency.suggestedFix.autoFixable) {
      return false;
    }

    try {
      switch (inconsistency.suggestedFix.action) {
        case 'update_unit_rent':
          return await this.updateUnitRent(
            inconsistency.affectedEntities.unit!.id,
            inconsistency.affectedEntities.tenant!.rent
          );
        
        case 'update_tenant_rent':
          return await this.updateTenantRent(
            inconsistency.affectedEntities.tenant!.id,
            inconsistency.affectedEntities.unit!.rent
          );
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error auto-fixing inconsistency:', error);
      return false;
    }
  }

  private async updateUnitRent(unitId: string, newRent: number): Promise<boolean> {
    const { error } = await supabase
      .from('units')
      .update({ monthly_rent: newRent })
      .eq('id', unitId);

    return !error;
  }

  private async updateTenantRent(tenantId: string, newRent: number): Promise<boolean> {
    const { error } = await supabase
      .from('tenants')
      .update({ rent_amount: newRent })
      .eq('id', tenantId);

    return !error;
  }
}
