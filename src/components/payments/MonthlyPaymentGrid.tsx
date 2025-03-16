
import { useState, useMemo } from "react";
import { Payment, Tenant } from "@/types";
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

interface MonthlyPaymentGridProps {
  tenants: Tenant[];
  payments: Payment[];
  onUpdatePayment: (payment: Payment) => void;
}

export function MonthlyPaymentGrid({ 
  tenants, 
  payments,
  onUpdatePayment 
}: MonthlyPaymentGridProps) {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
  }, []);
  
  const months = useMemo(() => {
    return [
      { label: "J", full: "January", index: 0 },
      { label: "F", full: "February", index: 1 },
      { label: "M", full: "March", index: 2 },
      { label: "A", full: "April", index: 3 },
      { label: "M", full: "May", index: 4 },
      { label: "J", full: "June", index: 5 },
      { label: "J", full: "July", index: 6 },
      { label: "A", full: "August", index: 7 },
      { label: "S", full: "September", index: 8 },
      { label: "O", full: "October", index: 9 },
      { label: "N", full: "November", index: 10 },
      { label: "D", full: "December", index: 11 },
    ];
  }, []);
  
  const hasPaymentForMonth = (tenantId: string, monthIndex: number, year: number) => {
    return payments.some(payment => {
      const paymentDate = new Date(payment.date);
      return (
        payment.tenantId === tenantId &&
        paymentDate.getFullYear() === year &&
        paymentDate.getMonth() === monthIndex &&
        payment.type === "rent" &&
        payment.status === "completed"
      );
    });
  };
  
  const getPaymentForMonth = (tenantId: string, monthIndex: number, year: number) => {
    return payments.find(payment => {
      const paymentDate = new Date(payment.date);
      return (
        payment.tenantId === tenantId &&
        paymentDate.getFullYear() === year &&
        paymentDate.getMonth() === monthIndex &&
        payment.type === "rent"
      );
    });
  };
  
  const handleCheckboxChange = (
    e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>, 
    checked: boolean | "indeterminate", 
    tenantId: string, 
    monthIndex: number,
    monthName: string
  ) => {
    // Prevent default browser behavior to avoid page navigation
    e.preventDefault();
    
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    
    const existingPayment = getPaymentForMonth(tenantId, monthIndex, selectedYear);
    
    if (checked === true) {
      if (existingPayment) {
        if (existingPayment.status !== "completed") {
          const updatedPayment = {
            ...existingPayment,
            status: "completed" as const
          };
          onUpdatePayment(updatedPayment);
          toast.success(`${monthName} payment for ${tenant.name} marked as paid`);
        }
      } else {
        const newPayment: Payment = {
          id: crypto.randomUUID(),
          tenantId,
          amount: tenant.rentAmount,
          date: new Date(selectedYear, monthIndex, 1).toISOString(),
          type: "rent",
          method: "transfer",
          status: "completed",
          createdAt: new Date().toISOString(),
        };
        onUpdatePayment(newPayment);
        toast.success(`${monthName} payment for ${tenant.name} marked as paid`);
      }
    } else {
      if (existingPayment && existingPayment.status === "completed") {
        const updatedPayment = {
          ...existingPayment,
          status: "pending" as const
        };
        onUpdatePayment(updatedPayment);
        toast.info(`${monthName} payment for ${tenant.name} marked as pending`);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-5 w-5" />
          <Label>View Payments For:</Label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Year" />
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
            Paid
          </Badge>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            Pending
          </Badge>
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Not Recorded
          </Badge>
        </div>
      </div>
      
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Tenant</TableHead>
                <TableHead className="min-w-[100px]">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Rent</span>
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
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                tenants
                .filter(tenant => tenant.status === "active")
                .map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      {tenant.name}
                      <div className="text-xs text-muted-foreground">Unit {tenant.unit}</div>
                    </TableCell>
                    <TableCell>${tenant.rentAmount.toLocaleString()}</TableCell>
                    {months.map((month) => {
                      const payment = getPaymentForMonth(tenant.id, month.index, selectedYear);
                      const isPaid = payment?.status === "completed";
                      const isPending = payment?.status === "pending";
                      
                      return (
                        <TableCell key={month.index} className="text-center">
                          <div 
                            onClick={(e) => {
                              // Handle container click to prevent page navigation
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className={cn(
                              "flex items-center justify-center p-1 rounded-md",
                              isPaid ? "bg-emerald-50" : isPending ? "bg-amber-50" : ""
                            )}
                          >
                            <Checkbox
                              checked={isPaid}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(
                                  // Pass the event object
                                  window.event as unknown as React.MouseEvent<HTMLButtonElement>,
                                  checked, 
                                  tenant.id, 
                                  month.index, 
                                  month.full
                                )
                              }
                              className={cn(
                                isPaid ? "border-emerald-500 data-[state=checked]:bg-emerald-500" : 
                                isPending ? "border-amber-500" : ""
                              )}
                              aria-label={`${month.full} payment for ${tenant.name}`}
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
    </div>
  );
}
