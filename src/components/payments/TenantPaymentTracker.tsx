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
import { Calendar, DollarSign } from "lucide-react";
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

interface TenantPaymentTrackerProps {
  tenants: Tenant[];
}

export function TenantPaymentTracker({ tenants }: TenantPaymentTrackerProps) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
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
      const { data, error } = await supabase
        .from('payments')
        .select('tenant_id, payment_date, status')
        .eq('user_id', user.id);

      if (error) throw error;

      const records: PaymentRecord[] = [];
      
      data?.forEach(payment => {
        const date = new Date(payment.payment_date);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        if (year === selectedYear) {
          records.push({
            tenantId: payment.tenant_id,
            year,
            month,
            paid: payment.status === 'completed'
          });
        }
      });

      setPaymentRecords(records);
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
      record.month === monthIndex && 
      record.paid
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
        // Create a payment record
        const { error } = await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            tenant_id: tenantId,
            amount: tenant.rentAmount,
            payment_date: new Date(selectedYear, monthIndex, 1).toISOString().split('T')[0],
            payment_method: 'cash',
            status: 'completed'
          });

        if (error) throw error;
        
        // Update local state
        setPaymentRecords(prev => [
          ...prev.filter(r => !(r.tenantId === tenantId && r.month === monthIndex)),
          { tenantId, year: selectedYear, month: monthIndex, paid: true }
        ]);
        
        toast.success(`Pago de ${monthName} para ${tenant.name} marcado como pagado`);
      } else {
        // Remove payment record
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('user_id', user.id)
          .eq('tenant_id', tenantId)
          .gte('payment_date', new Date(selectedYear, monthIndex, 1).toISOString().split('T')[0])
          .lt('payment_date', new Date(selectedYear, monthIndex + 1, 1).toISOString().split('T')[0]);

        if (error) throw error;
        
        // Update local state
        setPaymentRecords(prev => 
          prev.filter(r => !(r.tenantId === tenantId && r.month === monthIndex))
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
                <TableHead className="min-w-[180px]">Inquilino</TableHead>
                <TableHead className="min-w-[100px]">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Renta</span>
                  </div>
                </TableHead>
                {months.map((month) => (
                  <TableHead key={month.index} className="text-center w-[45px]" title={month.full}>
                    {month.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                    No hay inquilinos registrados
                  </TableCell>
                </TableRow>
              ) : (
                tenants
                .filter(tenant => tenant.status === "active")
                .map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      {tenant.name}
                      <div className="text-xs text-muted-foreground">Unidad {tenant.unit}</div>
                    </TableCell>
                    <TableCell>€{tenant.rentAmount.toLocaleString()}</TableCell>
                    {months.map((month) => {
                      const isPaid = hasPaymentForMonth(tenant.id, month.index);
                      
                      return (
                        <TableCell key={month.index} className="text-center">
                          <div 
                            className={cn(
                              "flex items-center justify-center p-1 rounded-md",
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