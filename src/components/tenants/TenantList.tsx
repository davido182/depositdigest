
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tenant, TenantStatus } from "@/types";
import { Edit, Trash2, Plus, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TenantListProps {
  tenants: Tenant[];
  onAddTenant: () => void;
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenant: Tenant) => void;
}

export function TenantList({
  tenants,
  onAddTenant,
  onEditTenant,
  onDeleteTenant,
}: TenantListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const [invitingTenant, setInvitingTenant] = useState<string | null>(null);
  const { createTenantInvitation } = useAuth();

  // Sort tenants by unit number
  const sortedTenants = [...tenants].sort((a, b) => {
    const unitA = parseInt(a.unit) || 0;
    const unitB = parseInt(b.unit) || 0;
    return unitA - unitB;
  });

  const filteredTenants = sortedTenants.filter((tenant) => {
    const matchesSearch = tenant.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleInviteTenant = async (tenant: Tenant) => {
    setInvitingTenant(tenant.id);
    try {
      const result = await createTenantInvitation(tenant.unit, tenant.email);
      
      toast.success("Invitación creada", {
        description: `Código de invitación: ${result.invitation_code}`,
        duration: 10000,
        action: {
          label: "Copiar código",
          onClick: () => navigator.clipboard.writeText(result.invitation_code)
        }
      });
      
      console.log("Invitation created:", result);
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error("Error al crear invitación", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    } finally {
      setInvitingTenant(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Tenants</h2>
          <p className="text-muted-foreground">
            Manage your property tenants and their details
          </p>
        </div>
        <Button onClick={onAddTenant} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          type="text"
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={statusFilter} onValueChange={(value: TenantStatus | "all") => setStatusFilter(value)}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="notice">Notice</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rent</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No tenants found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>{tenant.unit}</TableCell>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>{tenant.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tenant.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${tenant.rentAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleInviteTenant(tenant)}
                        disabled={invitingTenant === tenant.id}
                        title="Enviar invitación"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEditTenant(tenant)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the tenant from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteTenant(tenant)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
