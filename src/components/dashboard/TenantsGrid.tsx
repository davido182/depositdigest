
import { Tenant } from "@/types";
import { TenantCard } from "@/components/tenants/TenantCard";

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

  if (sortedTenants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay tenants registrados</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedTenants.map((tenant) => (
        <TenantCard
          key={tenant.id}
          tenant={tenant}
          onEdit={onEditTenant}
          onDelete={onDeleteTenant}
        />
      ))}
    </div>
  );
}
