
import { Tenant } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Home, Calendar, DollarSign } from "lucide-react";

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onDelete?: () => void;
}

export function TenantCard({ tenant, onEdit, onDelete }: TenantCardProps) {
  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-red-100 text-red-800";
      case "notice":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{tenant.name}</h3>
            <p className="text-sm text-muted-foreground">{tenant.email}</p>
          </div>
          <Badge className={getStatusColor(tenant.status)}>
            {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Unit {tenant.unit}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {new Date(tenant.moveInDate).toLocaleDateString()} - {tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : 'No End Date'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">${tenant.rentAmount}/month</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/50 px-6 py-3">
        <Button variant="ghost" size="sm" onClick={() => onEdit(tenant)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
