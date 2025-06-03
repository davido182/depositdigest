
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
import { AccountingEntry } from "@/types";

export function AccountingEntriesList() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);

  // Mock data for demonstration
  const mockEntries: AccountingEntry[] = [
    {
      id: "1",
      date: "2024-01-15",
      description: "Pago de renta - Unidad 101",
      accountId: "income-rent",
      creditAmount: 1500,
      reference: "REC-001",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "2",
      date: "2024-01-15",
      description: "Efectivo recibido",
      accountId: "asset-cash",
      debitAmount: 1500,
      reference: "REC-001",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Asientos Contables</h2>
          <p className="text-muted-foreground">
            Registra y gestiona todos los movimientos contables
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Asiento
        </Button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Debe</TableHead>
              <TableHead className="text-right">Haber</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay asientos contables registrados
                </TableCell>
              </TableRow>
            ) : (
              mockEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.accountId}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.debitAmount ? `$${entry.debitAmount.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.creditAmount ? `$${entry.creditAmount.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    {entry.reference || '-'}
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
