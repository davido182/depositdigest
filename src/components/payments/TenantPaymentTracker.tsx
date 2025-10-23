import { useState, useMemo, useEffect } from "react";
import { Tenant } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar, DollarSign, FileCheck, FileX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";

interface PaymentRecord {
  tenantId: string;
  year: number;
  month: number;
  paid: boolean;
}

interface PaymentReceipt {
  tenant_id: string;
  year: number;
  month: number;
  has_receipt: boolean;
}

interface TenantPaymentTrackerProps {
  tenants: Tenant[];
}

export function TenantPaymentTracker({ tenants }: TenantPaymentTrackerProps) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging for tenants data
  console.log('🔍 [PAYMENTS] TenantPaymentTracker received tenants:', tenants.length);
  if (tenants.length > 0) {
    console.log('🔍 [PAYMENTS] First tenant data:', {
      id: tenants[0].id,
      name: tenants[0].name,
      unit: tenants[0].unit,
      propertyName: tenants[0].propertyName,
      property_name: tenants[0].property_name,
      unit_number: tenants[0].unit_number
    });
  }
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
  }, []);
  
  const months = useMemo(() => {
    return [
      { label: "E", full: "Enero", index: 0 },
      { label: "F", full: "Febrero", index: 1 },
      { label: "M", full: "Marzo", index: 2 },
      { label: "A", full: "Abril", index: 3 },
      { label: "M", full: "Mayo", index: 4 },
      { label: "J", full: "Junio", index: 5 },
      { label: "J", full: "Julio", index: 6 },
      { label: "A", full: "Agosto", index: 7 },
      { label: "S", full: "Septiembre", index: 8 },
      { label: "O", full: "Octubre", index: 9 },
      { label: "N", full: "Noviembre", index: 10 },
      { label: "D", full: "Diciembre", index: 11 },
    ];
  }, []);

  useEffect(() => {
    loadPaymentRecords();
  }, [selectedYear, user]);

  const loadPaymentRecords = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load from localStorage for now (more reliable)
      const storageKey = `payment_records_${user.id}_${selectedYear}`;
      const storedRecords = localStorage.getItem(storageKey);
      
      const records: PaymentRecord[] = storedRecords ? JSON.parse(storedRecords) : [];
      const receipts: PaymentReceipt[] = [];

      setPaymentRecords(records);
      setPaymentReceipts(receipts);
    } catch (error) {
      console.error('Error loading payment records:', error);
      // Don't show error toast for localStorage issues
      setPaymentRecords([]);
      setPaymentReceipts([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const hasPaymentForMonth = (tenantId: string, monthIndex: number) => {
    return paymentRecords.some(record => 
      record.tenantId === tenantId && 
      record.year === selectedYear &&
      record.month === monthIndex && 
      record.paid
    );
  };

  const hasReceiptForMonth = (tenantId: string, monthIndex: number) => {
    return paymentReceipts.some(receipt => 
      receipt.tenant_id === tenantId && 
      receipt.year === selectedYear &&
      receipt.month === monthIndex + 1 && // Receipt months are 1-indexed
      receipt.has_receipt
    );
  };

  const getPaymentStatus = (tenantId: string, monthIndex: number) => {
    const isPaid = hasPaymentForMonth(tenantId, monthIndex);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // If it's paid, return paid status
    if (isPaid) {
      return 'paid';
    }
    
    // Check if tenant started after this month (mark as N/A)
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      // Try different date fields that might be available
      let startDate = null;
      
      if (tenant.moveInDate) {
        startDate = new Date(tenant.moveInDate);
      } else if ((tenant as any).move_in_date) {
        startDate = new Date((tenant as any).move_in_date);
      } else if (tenant.leaseStartDate) {
        startDate = new Date(tenant.leaseStartDate);
      } else if ((tenant as any).lease_start_date) {
        startDate = new Date((tenant as any).lease_start_date);
      } else if ((tenant as any).created_at) {
        // Fallback to creation date if no move-in date is available
        startDate = new Date((tenant as any).created_at);
      }
      
      if (startDate) {
        const monthEndDate = new Date(selectedYear, monthIndex + 1, 0); // Last day of the month
        
        // If tenant started after this entire month, mark as N/A
        if (startDate > monthEndDate) {
          return 'na'; // Not applicable - tenant wasn't living here yet
        }
      }
    }
    
    // If it's a future month, return future status
    if (selectedYear > currentYear || (selectedYear === currentYear && monthIndex > currentMonth)) {
      return 'future';
    }
    
    // If it's the current month, return pending
    if (selectedYear === currentYear && monthIndex === currentMonth) {
      return 'pending';
    }
    
    // If it's a past month and not paid, return overdue
    return 'overdue';
  };
  
  const handleCheckboxChange = async (
    checked: boolean | "indeterminate", 
    tenantId: string, 
    monthIndex: number,
    monthName: string
  ) => {
    if (!user) return;
    
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    try {
      const storageKey = `payment_records_${user.id}_${selectedYear}`;
      
      if (checked === true) {
        // Update local state and localStorage
        const newRecord = { tenantId, year: selectedYear, month: monthIndex, paid: true };
        const updatedRecords = [
          ...paymentRecords.filter(r => !(r.tenantId === tenantId && r.year === selectedYear && r.month === monthIndex)),
          newRecord
        ];
        
        setPaymentRecords(updatedRecords);
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
        
        toast.success(`Pago de ${monthName} para ${tenant.name} marcado como pagado`);
      } else {
        // Remove from local state and localStorage
        const updatedRecords = paymentRecords.filter(r => 
          !(r.tenantId === tenantId && r.year === selectedYear && r.month === monthIndex)
        );
        
        setPaymentRecords(updatedRecords);
        localStorage.setItem(storageKey, JSON.stringify(updatedRecords));
        
        toast.info(`Pago de ${monthName} para ${tenant.name} marcado como pendiente`);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Error al actualizar el pago');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-5 w-5" />
          <Label>Ver Pagos del Año:</Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Seleccionar Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
            Pagado
          </Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pendiente
          </Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Vencido
          </Badge>
          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
            Futuro
          </Badge>
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
            N/A
          </Badge>
        </div>
      </div>
      
      <div className="rounded-xl overflow-hidden border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Propiedad</TableHead>
                <TableHead className="min-w-[160px]">Inquilino</TableHead>
                <TableHead className="min-w-[100px]">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Renta</span>
                  </div>
                </TableHead>
                 {months.map((month) => (
                   <TableHead key={month.index} className="text-center w-[60px]" title={month.full}>
                      <div className="flex flex-col items-center gap-1">
                        <span>{month.label}</span>
                        <div className="flex gap-1">
                          <div title="Con comprobante">
                            <FileCheck className="h-3 w-3 text-green-600" />
                          </div>
                          <div title="Sin comprobante">
                            <FileX className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                   </TableHead>
                 ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={15} className="h-24 text-center text-muted-foreground">
                     No hay inquilinos registrados
                   </TableCell>
                 </TableRow>
              ) : (
                tenants
                .filter(tenant => tenant.status === "active")
                .sort((a, b) => {
                  const buildingA = a.unit.substring(0, 1);
                  const buildingB = b.unit.substring(0, 1);
                  if (buildingA !== buildingB) {
                    return buildingA.localeCompare(buildingB);
                  }
                  return parseInt(a.unit) - parseInt(b.unit);
                })
                .map((tenant) => (
                   <TableRow key={tenant.id}>
                     <TableCell className="font-medium">
                       <div className="text-xs text-muted-foreground">
                         {tenant.propertyName || 'Sin propiedad'}
                       </div>
                     </TableCell>
                     <TableCell className="font-medium">
                       {tenant.name}
                       <div className="text-xs text-muted-foreground">Unidad {tenant.unit}</div>
                     </TableCell>
                     <TableCell>€{tenant.rentAmount.toLocaleString()}</TableCell>
                     {months.map((month) => {
                       const isPaid = hasPaymentForMonth(tenant.id, month.index);
                       const hasReceipt = hasReceiptForMonth(tenant.id, month.index);
                       const paymentStatus = getPaymentStatus(tenant.id, month.index);
                       
                       const statusStyles = {
                         paid: "bg-emerald-50 border-emerald-200",
                         pending: "bg-yellow-50 border-yellow-200",
                         overdue: "bg-red-50 border-red-200",
                         future: "bg-gray-50 border-gray-200",
                         na: "bg-slate-50 border-slate-200"
                       };
                       
                       const checkboxStyles = {
                         paid: "border-emerald-500 data-[state=checked]:bg-emerald-500",
                         pending: "border-yellow-500",
                         overdue: "border-red-500",
                         future: "border-gray-400",
                         na: "border-slate-400"
                       };
                       
                       return (
                         <TableCell key={month.index} className="text-center">
                           <div 
                             className={cn(
                               "flex flex-col items-center gap-1 p-1 rounded-md border",
                               statusStyles[paymentStatus]
                             )}
                           >
                             {paymentStatus === 'na' ? (
                               <div className="text-xs text-slate-500 font-medium">N/A</div>
                             ) : (
                               <Checkbox
                                 checked={isPaid}
                                 onCheckedChange={(checked) => 
                                   handleCheckboxChange(
                                     checked, 
                                     tenant.id, 
                                     month.index, 
                                     month.full
                                   )
                                 }
                                 className={cn(checkboxStyles[paymentStatus])}
                                 aria-label={`${month.full} pago para ${tenant.name} - ${paymentStatus}`}
                               />
                             )}
                              <div className="flex gap-1">
                                {hasReceipt ? (
                                  <div title="Tiene comprobante">
                                    <FileCheck className="h-3 w-3 text-green-600" />
                                  </div>
                                ) : (
                                  <div title="Sin comprobante">
                                    <FileX className="h-3 w-3 text-gray-400" />
                                  </div>
                                )}
                              </div>
                           </div>
                         </TableCell>
                       );
                     })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {tenants.filter(t => t.status === "active").length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No hay inquilinos activos para mostrar pagos.</p>
        </div>
      )}
    </div>
  );
}