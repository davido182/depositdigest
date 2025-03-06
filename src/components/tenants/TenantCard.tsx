
import { Tenant } from "@/types";
import { Calendar, DollarSign, Home, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
}

export function TenantCard({ tenant, onEdit }: TenantCardProps) {
  const statusColors = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    inactive: "bg-slate-100 text-slate-800 border-slate-200",
    late: "bg-red-100 text-red-800 border-red-200",
    notice: "bg-amber-100 text-amber-800 border-amber-200",
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden relative animate-slide-in">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{tenant.name}</h3>
            <Badge
              variant="outline"
              className={cn(
                "mt-1.5 capitalize",
                statusColors[tenant.status]
              )}
            >
              {tenant.status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => onEdit(tenant)}
          >
            Edit
          </Button>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Home className="h-4 w-4 mr-2" />
            <span>Unit {tenant.unit}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Phone className="h-4 w-4 mr-2" />
            <span>{tenant.phone}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Mail className="h-4 w-4 mr-2" />
            <span className="truncate max-w-[200px]">{tenant.email}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground flex items-center">
              <DollarSign className="h-3 w-3 mr-1" /> Rent
            </div>
            <div className="font-medium">
              ${tenant.rentAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center">
              <Calendar className="h-3 w-3 mr-1" /> Lease End
            </div>
            <div className="font-medium">
              {new Date(tenant.leaseEndDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
