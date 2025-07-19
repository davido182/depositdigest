
import { Tenant } from "@/types";
import { TenantsTable } from "@/components/tenants/TenantsTable";

interface TenantsGridProps {
  tenants: Tenant[];
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenant: Tenant) => void;
}

export function TenantsGrid({ tenants, onEditTenant, onDeleteTenant }: TenantsGridProps) {
  // Ordenar tenants por número de unidad
  const sortedTenants = [...tenants].sort((a, b) => {
    const unitA = parseInt(a.unit || '0') || 0;
    const unitB = parseInt(b.unit || '0') || 0;
    return unitA - unitB;
  });

  return (
    <TenantsTable
      tenants={sortedTenants}
      onEditTenant={onEditTenant}
      onDeleteTenant={onDeleteTenant}
    />
  );
}
