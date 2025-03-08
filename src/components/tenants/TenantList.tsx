
import { useState } from "react";
import { Tenant } from "@/types";
import { TenantCard } from "./TenantCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TenantListProps {
  tenants: Tenant[];
  onAddTenant: () => void;
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant?: (tenant: Tenant) => void;
}

export function TenantList({
  tenants,
  onAddTenant,
  onEditTenant,
  onDeleteTenant,
}: TenantListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDeleteClick = (tenant: Tenant) => {
    setTenantToDelete(tenant);
  };
  
  const confirmDelete = () => {
    if (tenantToDelete && onDeleteTenant) {
      onDeleteTenant(tenantToDelete);
    }
    setTenantToDelete(null);
  };

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
              onDelete={onDeleteTenant ? () => handleDeleteClick(tenant) : undefined}
            />
          ))}
        </div>
      )}
      
      <AlertDialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete tenant {tenantToDelete?.name} from unit {tenantToDelete?.unit}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
