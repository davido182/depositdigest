import { useState } from "react";
import { Tenant } from "@/types";
import {
  ResponsiveTable as Table,
  ResponsiveTableBody as TableBody,
  ResponsiveTableCell as TableCell,
  ResponsiveTableHead as TableHead,
  ResponsiveTableHeader as TableHeader,
  ResponsiveTableRow as TableRow,
} from "@/components/ui/responsive-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Circle,
  Calendar,
} from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";

interface TenantsTableProps {
  tenants: Tenant[];
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (tenant: Tenant) => void;
}

export function TenantsTable({ tenants, onEditTenant, onDeleteTenant }: TenantsTableProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("unit");
  const [deleteConfirmTenant, setDeleteConfirmTenant] = useState<Tenant | null>(null);

  // Debug logging for tenants data
  console.log('🔍 [TABLE] TenantsTable received tenants:', tenants.length);
  if (tenants.length > 0) {
    console.log('🔍 [TABLE] First tenant data:', {
      id: tenants[0].id,
      name: tenants[0].name,
      unit: tenants[0].unit,
      propertyName: tenants[0].propertyName,
      property_name: tenants[0].property_name,
      unit_number: tenants[0].unit_number
    });
  }

  // Filtrar y ordenar inquilinos
  const filteredAndSortedTenants = tenants
    .filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.unit.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "unit":
          return parseInt(a.unit || "0") - parseInt(b.unit || "0");
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(a.moveInDate).getTime() - new Date(b.moveInDate).getTime();
        case "rent":
          return (a.rentAmount || 0) - (b.rentAmount || 0);
        case "property":
          const propertyA = a.unit?.substring(0, 1) || "";
          const propertyB = b.unit?.substring(0, 1) || "";
          return propertyA.localeCompare(propertyB);
        case "age":
          return new Date(a.moveInDate).getTime() - new Date(b.moveInDate).getTime();
        default:
          return 0;
      }
    });

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

  const getCurrentMonthPaymentStatus = (tenant: Tenant) => {
    try {
      // Get payment tracking from localStorage (same as TenantPaymentTracker)
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const currentDay = new Date().getDate();

      // Get payment records for current user
      const storageKey = `payment_records_${user?.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(storageKey);

      if (storedRecords) {
        const records = JSON.parse(storedRecords);
        const tenantPayment = records.find((r: any) =>
          r.tenantId === tenant.id &&
          r.year === currentYear &&
          r.month === currentMonth
        );

        if (tenantPayment && tenantPayment.paid) {
          return "paid";
        }
      }

      // If not paid, determine if overdue or pending
      if (currentDay > 5) {
        return "overdue"; // Consider overdue after 5th of month
      } else {
        return "pending"; // Still within grace period
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      return "pending";
    }
  };

  const getNextPaymentDate = (tenant: Tenant) => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "pending":
        return <Circle className="h-5 w-5 text-amber-600" />;
      case "overdue":
        return <Circle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setDeleteConfirmTenant(tenant);
  };

  const confirmDelete = () => {
    if (deleteConfirmTenant) {
      onDeleteTenant(deleteConfirmTenant);
      setDeleteConfirmTenant(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de filtrado y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar inquilinos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="late">Atrasado</SelectItem>
                <SelectItem value="notice">Aviso</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unit">Unidad</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="date">Fecha ingreso</SelectItem>
                <SelectItem value="rent">Renta</SelectItem>
                <SelectItem value="property">Propiedad</SelectItem>
                <SelectItem value="age">Antigüedad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de inquilinos - Responsive */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">💳</TableHead>
              <TableHead className="w-[120px]">Propiedad</TableHead>
              <TableHead className="w-[80px]">Unidad</TableHead>
              <TableHead className="w-[150px]">Inquilino</TableHead>
              <TableHead className="w-[200px] hidden sm:table-cell">Email</TableHead>
              <TableHead className="w-[110px] hidden lg:table-cell">Fecha Ingreso</TableHead>
              <TableHead className="w-[110px] hidden lg:table-cell">Fin Contrato</TableHead>
              <TableHead className="w-[90px]">Estado</TableHead>
              <TableHead className="w-[100px] text-right">Renta</TableHead>
              <TableHead className="w-[120px] hidden md:table-cell">Próximo Pago</TableHead>
              <TableHead className="w-20 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No se encontraron inquilinos
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTenants.map((tenant) => {
                const paymentStatus = getCurrentMonthPaymentStatus(tenant);
                return (
                  <TableRow key={tenant.id} className="hover:bg-muted/50">
                    <TableCell className="text-center">
                      {getPaymentStatusIcon(paymentStatus)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <div className="truncate max-w-[120px]" title={tenant.propertyName || 'Sin asignar'}>
                        {tenant.propertyName && tenant.propertyName.trim() !== '' ? tenant.propertyName : "Sin asignar"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {tenant.unit && tenant.unit.trim() !== '' && tenant.unit !== 'Sin unidad' ? tenant.unit : "Sin asignar"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">
                        {tenant.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                      {tenant.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                      {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                      {tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      €{tenant.rentAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {getNextPaymentDate(tenant)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTenant(tenant)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(tenant)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Leyenda de estados de pago */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>Pagado</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="h-4 w-4 text-amber-600" />
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="h-4 w-4 text-red-600" />
          <span>Vencido</span>
        </div>
      </div>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteConfirmTenant} onOpenChange={() => setDeleteConfirmTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar inquilino?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a {deleteConfirmTenant?.name} de la unidad {deleteConfirmTenant?.unit}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}