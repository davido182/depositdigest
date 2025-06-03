
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TaxEntry } from "@/types";

export function TaxEntriesList() {
  const [taxEntries, setTaxEntries] = useState<TaxEntry[]>([]);

  // Mock tax entries for demonstration
  const mockTaxEntries: TaxEntry[] = [
    {
      id: "1",
      date: "2024-01-31",
      description: "IVA Enero 2024",
      taxType: "vat",
      baseAmount: 10000,
      taxRate: 16,
      taxAmount: 1600,
      status: "pending",
      dueDate: "2024-02-15",
      reference: "IVA-2024-01",
      createdAt: "2024-01-31T00:00:00Z",
      updatedAt: "2024-01-31T00:00:00Z"
    },
    {
      id: "2",
      date: "2024-01-15",
      description: "Impuesto Municipal Q1",
      taxType: "municipal_tax",
      baseAmount: 50000,
      taxRate: 0.5,
      taxAmount: 250,
      status: "paid",
      dueDate: "2024-01-20",
      paidDate: "2024-01-18",
      reference: "MUN-2024-Q1",
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-18T00:00:00Z"
    },
    {
      id: "3",
      date: "2024-01-10",
      description: "Retención en la Fuente",
      taxType: "withholding_tax",
      baseAmount: 5000,
      taxRate: 10,
      taxAmount: 500,
      status: "pending",
      dueDate: "2024-02-10",
      reference: "RET-2024-001",
      createdAt: "2024-01-10T00:00:00Z",
      updatedAt: "2024-01-10T00:00:00Z"
    }
  ];

  const getTaxTypeLabel = (type: string) => {
    const labels = {
      municipal_tax: "Impuesto Municipal",
      fire_department_fee: "Tasa Bomberos",
      vat: "IVA",
      income_tax: "Impuesto Renta",
      withholding_tax: "Retención",
      other: "Otro"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      overdue: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const isOverdue = (entry: TaxEntry) => {
    if (entry.status === 'paid' || !entry.dueDate) return false;
    return new Date(entry.dueDate) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Impuestos</h2>
          <p className="text-muted-foreground">
            Controla todos los impuestos, tasas y retenciones
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Impuesto
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Base Imponible</TableHead>
              <TableHead className="text-right">Tasa %</TableHead>
              <TableHead className="text-right">Impuesto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTaxEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No hay impuestos registrados
                </TableCell>
              </TableRow>
            ) : (
              mockTaxEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTaxTypeLabel(entry.taxType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${entry.baseAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.taxRate}%
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    ${entry.taxAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isOverdue(entry) && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(isOverdue(entry) ? "overdue" : entry.status)}
                      >
                        {isOverdue(entry) ? "Vencido" : 
                         entry.status === "pending" ? "Pendiente" :
                         entry.status === "paid" ? "Pagado" :
                         entry.status === "cancelled" ? "Cancelado" : entry.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.dueDate ? new Date(entry.dueDate).toLocaleDateString() : '-'}
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
