
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "./PaymentForm";
import { Plus, Download, Eye, Trash2 } from "lucide-react";
import { Payment, Tenant } from "@/types";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface PaymentsListProps {
  payments: Payment[];
  tenants: Tenant[];
  tenantNames: Record<string, string>;
  onAddPayment?: () => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentsList({ 
  payments, 
  tenants, 
  tenantNames, 
  onAddPayment, 
  onUpdatePayment,
  onDeletePayment 
}: PaymentsListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);

  const handleAddPayment = async (payment: Payment) => {
    console.log('PaymentsList: Agregando nuevo pago:', payment);
    try {
      // Call onUpdatePayment for both add and update operations
      await onUpdatePayment(payment);
      setIsAddModalOpen(false);
      toast.success("Pago agregado exitosamente");
    } catch (error) {
      console.error('PaymentsList: Error al agregar pago:', error);
      toast.error('Error al guardar el pago');
    }
  };

  const handleUpdatePayment = (payment: Payment) => {
    console.log('PaymentsList: Actualizando pago:', payment);
    onUpdatePayment(payment);
    setEditingPayment(null);
    toast.success("Pago actualizado exitosamente");
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (onDeletePayment) {
      try {
        await onDeletePayment(paymentId);
      } catch (error) {
        console.error('Error al eliminar pago:', error);
      }
    }
  };

  const handleDownloadPayment = (payment: Payment) => {
    const tenant = tenants.find(t => t.id === payment.tenantId);
    const content = `Comprobante de Pago
ID: ${payment.id}
Inquilino: ${tenant?.name || 'No encontrado'}
Unidad: ${tenant?.unit || 'N/A'}
Monto: $${payment.amount.toLocaleString()}
Fecha: ${payment.date}
Tipo: ${payment.type}
Método: ${payment.method}
Estado: ${payment.status}
Notas: ${payment.notes || 'Sin notas'}
Generado: ${new Date().toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pago-${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Comprobante descargado');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'rent': 'Alquiler',
      'deposit': 'Depósito',
      'fee': 'Tarifa',
      'other': 'Otro'
    };
    return labels[type] || type;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'cash': 'Efectivo',
      'transfer': 'Transferencia',
      'card': 'Tarjeta',
      'check': 'Cheque',
      'other': 'Otro'
    };
    return labels[method] || method;
  };

  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pagos Registrados ({payments.length})</h3>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Pago
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay pagos registrados</p>
          <p className="text-sm mt-1">Agrega tu primer pago o procesa un comprobante</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inquilino</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {tenantNames[payment.tenantId] || 'Inquilino no encontrado'}
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{getTypeLabel(payment.type)}</TableCell>
                  <TableCell>{getMethodLabel(payment.method)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status === 'completed' ? 'Completado' : 
                       payment.status === 'pending' ? 'Pendiente' : 
                       payment.status === 'failed' ? 'Fallido' : payment.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setViewingPayment(payment)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalles del Pago</DialogTitle>
                          </DialogHeader>
                          {viewingPayment && (
                            <div className="space-y-3">
                              <div><strong>ID:</strong> {viewingPayment.id}</div>
                              <div><strong>Inquilino:</strong> {tenantNames[viewingPayment.tenantId]}</div>
                              <div><strong>Monto:</strong> {formatCurrency(viewingPayment.amount)}</div>
                              <div><strong>Fecha:</strong> {viewingPayment.date}</div>
                              <div><strong>Tipo:</strong> {getTypeLabel(viewingPayment.type)}</div>
                              <div><strong>Método:</strong> {getMethodLabel(viewingPayment.method)}</div>
                              <div><strong>Estado:</strong> {viewingPayment.status}</div>
                              {viewingPayment.notes && (
                                <div><strong>Notas:</strong> {viewingPayment.notes}</div>
                              )}
                              <div><strong>Creado:</strong> {new Date(viewingPayment.createdAt).toLocaleString()}</div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDownloadPayment(payment)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingPayment(payment)}
                      >
                        Editar
                      </Button>
                      
                      {onDeletePayment && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente este pago
                                de ${formatCurrency(payment.amount)}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePayment(payment.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Payment Form for adding new payments */}
      <PaymentForm
        payment={null}
        tenants={tenants}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddPayment}
      />

      {/* Payment Form for editing existing payments */}
      <PaymentForm
        payment={editingPayment}
        tenants={tenants}
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        onSave={handleUpdatePayment}
      />
    </div>
  );
}
