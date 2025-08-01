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
import { supabase } from "@/integrations/supabase/client";
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
      
      // Load payment tracking records from payment_receipts table
      const { data: trackingRecords, error: trackingError } = await supabase
        .from('payment_receipts')
        .select('tenant_id, year, month, has_receipt')
        .eq('user_id', user.id)
        .eq('year', selectedYear);

      if (trackingError) throw trackingError;

      const records: PaymentRecord[] = [];
      
      trackingRecords?.forEach(record => {
        if (record.has_receipt) {
          records.push({
            tenantId: record.tenant_id,
            year: record.year,
            month: record.month - 1, // Convert to 0-indexed for local state
            paid: true
          });
        }
      });

      // Load receipt records
      const { data: receipts, error: receiptsError } = await supabase
        .from('payment_receipts')
        .select('tenant_id, year, month, has_receipt')
        .eq('user_id', user.id)
        .eq('year', selectedYear);

      if (receiptsError) throw receiptsError;

      setPaymentRecords(records);
      setPaymentReceipts(receipts || []);
    } catch (error) {
      console.error('Error loading payment records:', error);
      toast.error('Error al cargar los registros de pagos');
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
      if (checked === true) {
        // Create a tracking record in payment_receipts table (this is independent from actual payments)
        const { error } = await supabase
          .from('payment_receipts')
          .upsert({
            user_id: user.id,
            tenant_id: tenantId,
            year: selectedYear,
            month: monthIndex + 1, // Payment receipts months are 1-indexed
            has_receipt: true
          }, { onConflict: 'user_id,tenant_id,year,month' });

        if (error) throw error;
        
        // Update local state
        setPaymentRecords(prev => [
          ...prev.filter(r => !(r.tenantId === tenantId && r.month === monthIndex)),
          { tenantId, year: selectedYear, month: monthIndex, paid: true }
        ]);
        
        toast.success(`Pago de ${monthName} para ${tenant.name} marcado como pagado`);
      } else {
        // Remove tracking record
        const { error } = await supabase
          .from('payment_receipts')
          .delete()
          .eq('user_id', user.id)
          .eq('tenant_id', tenantId)
          .eq('year', selectedYear)
          .eq('month', monthIndex + 1);

        if (error) throw error;
        
        // Update local state
        setPaymentRecords(prev => 
          prev.filter(r => !(r.tenantId === tenantId && r.year === selectedYear && r.month === monthIndex))
        );
        
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
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Pendiente
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
                         Edificio {tenant.unit.substring(0, 1)}
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
                       
                       return (
                         <TableCell key={month.index} className="text-center">
                           <div 
                             className={cn(
                               "flex flex-col items-center gap-1 p-1 rounded-md",
                               isPaid ? "bg-emerald-50" : ""
                             )}
                           >
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
                               className={cn(
                                 isPaid ? "border-emerald-500 data-[state=checked]:bg-emerald-500" : ""
                               )}
                               aria-label={`${month.full} pago para ${tenant.name}`}
                             />
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