
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Account } from "@/types";

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Mock accounts for demonstration
  const mockAccounts: Account[] = [
    {
      id: "asset-cash",
      code: "1001",
      name: "Efectivo",
      type: "asset",
      isActive: true,
      description: "Dinero en efectivo",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      id: "asset-bank",
      code: "1002",
      name: "Banco",
      type: "asset",
      isActive: true,
      description: "Cuenta bancaria principal",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      id: "income-rent",
      code: "4001",
      name: "Ingresos por Rentas",
      type: "income",
      isActive: true,
      description: "Ingresos por alquiler de propiedades",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      id: "expense-maintenance",
      code: "5001",
      name: "Gastos de Mantenimiento",
      type: "expense",
      isActive: true,
      description: "Gastos relacionados con mantenimiento",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      id: "liability-taxes",
      code: "2001",
      name: "Impuestos por Pagar",
      type: "liability",
      isActive: true,
      description: "Impuestos pendientes de pago",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  ];

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: "bg-green-100 text-green-800 border-green-200",
      liability: "bg-red-100 text-red-800 border-red-200",
      equity: "bg-blue-100 text-blue-800 border-blue-200",
      income: "bg-purple-100 text-purple-800 border-purple-200",
      expense: "bg-orange-100 text-orange-800 border-orange-200"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Plan de Cuentas</h2>
          <p className="text-muted-foreground">
            Gestiona el catálogo de cuentas contables
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cuenta
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay cuentas registradas
                </TableCell>
              </TableRow>
            ) : (
              mockAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono font-medium">
                    {account.code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {account.name}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getAccountTypeColor(account.type)}
                    >
                      {account.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={account.isActive ? "default" : "secondary"}
                    >
                      {account.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {account.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
