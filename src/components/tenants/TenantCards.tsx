import { Tenant } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Home, DollarSign, Calendar } from "lucide-react";

interface TenantCardsProps {
  tenants: Tenant[];
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenant: Tenant) => void;
}

export function TenantCards({ tenants, onEditTenant, onDeleteTenant }: TenantCardsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800">Activo</Badge>;
      case "late":
        return <Badge className="bg-red-100 text-red-800">Atrasado</Badge>;
      case "notice":
        return <Badge className="bg-amber-100 text-amber-800">Aviso</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (tenants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay inquilinos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Mis Inquilinos</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{tenant.email}</p>
                </div>
                {getStatusBadge(tenant.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.propertyName || "Sin propiedad"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.unit || "Sin unidad asignada"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">€{(tenant.rentAmount || 0).toLocaleString()}/mes</span>
                </div>
                
                {/* Fechas de entrada y salida */}
                <div className="space-y-1 pt-1 border-t border-gray-100">
                  {tenant.moveInDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Entrada: {new Date(tenant.moveInDate).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                  {tenant.leaseEndDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Salida: {new Date(tenant.leaseEndDate).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                  {!tenant.moveInDate && !tenant.leaseEndDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Sin fechas registradas</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditTenant(tenant)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteTenant(tenant)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
