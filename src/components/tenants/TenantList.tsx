
import { useState } from "react";
import { Tenant } from "@/types";
import { TenantCard } from "./TenantCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface TenantListProps {
  tenants: Tenant[];
  onAddTenant: () => void;
  onEditTenant: (tenant: Tenant) => void;
}

export function TenantList({
  tenants,
  onAddTenant,
  onEditTenant,
}: TenantListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Tenants</h2>
        <div className="flex items-center w-full sm:w-auto gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[250px]"
            />
          </div>
          <Button onClick={onAddTenant} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Tenant</span>
          </Button>
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tenants found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onEdit={onEditTenant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
