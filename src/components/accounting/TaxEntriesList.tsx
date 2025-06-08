
import { useState, useEffect } from "react";
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
import { TaxEntryForm } from "./TaxEntryForm";
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

export function TaxEntriesList() {
  const [taxEntries, setTaxEntries] = useState<TaxEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TaxEntry | null>(null);

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
    }
  ];

  useEffect(() => {
    setTaxEntries(mockTaxEntries);
  }, []);

  const handleAddEntry = () => {
    setCurrentEntry(null);
    setIsFormOpen(true);
  };

  const handleEditEntry = (entry: TaxEntry) => {
    setCurrentEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    setTaxEntries(prev => prev.filter(e => e.id !== entryId));
    toast.success("Impuesto eliminado");
  };

  const handleSaveEntry = (entry: TaxEntry) => {
    if (currentEntry) {
      setTaxEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
      toast.success("Impuesto actualizado");
    } else {
      setTaxEntries(prev => [...prev, entry]);
      toast.success("Impuesto creado");
    }
    setIsFormOpen(false);
    setCurrentEntry(null);
  };

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
        <Button className="gap-2" onClick={handleAddEntry}>
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
            {taxEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No hay impuestos registrados
                </TableCell>
              </TableRow>
            ) : (
              taxEntries.map((entry) => (
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
                            <AlertDialogTitle>¿Eliminar impuesto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El impuesto será eliminado permanentemente.
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

      <TaxEntryForm
        entry={currentEntry}
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
