
import { useState, useEffect } from "react";
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
import { AccountingEntry, Account } from "@/types";
import { AccountingEntryForm } from "./AccountingEntryForm";
import { toast } from "sonner";
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

export function AccountingEntriesList() {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<AccountingEntry | null>(null);

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

  const mockAccounts: Account[] = [
    {
      id: "asset-cash",
      code: "1001",
      name: "Efectivo",
      type: "asset",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      id: "income-rent",
      code: "4001",
      name: "Ingresos por Alquiler",
      type: "income",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  ];

  useEffect(() => {
    setEntries(mockEntries);
    setAccounts(mockAccounts);
  }, []);

  const handleAddEntry = () => {
    setCurrentEntry(null);
    setIsFormOpen(true);
  };

  const handleEditEntry = (entry: AccountingEntry) => {
    setCurrentEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    toast.success("Asiento contable eliminado");
  };

  const handleSaveEntry = (entry: AccountingEntry) => {
    if (currentEntry) {
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
      toast.success("Asiento contable actualizado");
    } else {
      setEntries(prev => [...prev, entry]);
      toast.success("Asiento contable creado");
    }
    setIsFormOpen(false);
    setCurrentEntry(null);
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Asientos Contables</h2>
          <p className="text-muted-foreground">
            Registra y gestiona todos los movimientos contables
          </p>
        </div>
        <Button className="gap-2" onClick={handleAddEntry}>
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
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay asientos contables registrados
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getAccountName(entry.accountId)}</Badge>
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar asiento contable?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El asiento contable será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>
                              Eliminar
                            </AlertDialogAction>
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

      <AccountingEntryForm
        entry={currentEntry}
        accounts={accounts}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setCurrentEntry(null);
        }}
        onSave={handleSaveEntry}
      />
    </div>
  );
}
