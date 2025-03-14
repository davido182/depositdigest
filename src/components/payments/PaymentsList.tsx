
import { useState } from "react";
import { Payment, Tenant } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Edit, ArrowLeftRight } from "lucide-react";
import { PaymentForm } from "./PaymentForm";
import { MonthlyPaymentGrid } from "./MonthlyPaymentGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentsListProps {
  payments: Payment[];
  tenants: Tenant[];
  tenantNames: Record<string, string>;
  onAddPayment: () => void;
  onUpdatePayment: (payment: Payment) => void;
}

export function PaymentsList({
  payments,
  tenants,
  tenantNames,
  onAddPayment,
  onUpdatePayment,
}: PaymentsListProps) {
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "grid">("list");
  
  const statusColors = {
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    refunded: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const handleOpenPaymentForm = () => {
    setIsPaymentFormOpen(true);
  };

  const toggleView = () => {
    setCurrentView(currentView === "list" ? "grid" : "list");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Payments</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleView}
            className="gap-1.5"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>{currentView === "list" ? "Monthly Grid" : "List View"}</span>
          </Button>
          <Button onClick={handleOpenPaymentForm} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Payment</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" value={currentView} onValueChange={(value) => setCurrentView(value as "list" | "grid")}>
        <TabsList className="hidden">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-0">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{tenantNames[payment.tenantId] || "Unknown"}</TableCell>
                        <TableCell className="font-medium">
                          ${payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="capitalize">{payment.type}</TableCell>
                        <TableCell className="capitalize">{payment.method}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              statusColors[payment.status]
                            )}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="grid" className="mt-0">
          <MonthlyPaymentGrid 
            tenants={tenants} 
            payments={payments}
            onUpdatePayment={onUpdatePayment}
          />
        </TabsContent>
      </Tabs>
      
      <PaymentForm 
        isOpen={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
        onSave={onAddPayment}
      />
    </div>
  );
}
