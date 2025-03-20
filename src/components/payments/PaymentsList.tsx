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
import { Plus, Edit, ArrowLeftRight, List, Tags, Trash2 } from "lucide-react";
import { PaymentForm } from "./PaymentForm";
import { MonthlyPaymentGrid } from "./MonthlyPaymentGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  onAddPayment: () => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentsList({
  payments,
  tenants,
  tenantNames,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
}: PaymentsListProps) {
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "grid">("list");
  const [groupBy, setGroupBy] = useState<"none" | "unit">("none");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  
  const statusColors = {
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    refunded: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const getUnitForTenant = (tenantId: string): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.unit : "Unknown";
  };
  
  const getGroupedPayments = () => {
    if (groupBy === "none") {
      return { "": sortedPayments };
    }
    
    return sortedPayments.reduce((groups, payment) => {
      const unit = getUnitForTenant(payment.tenantId);
      if (!groups[unit]) {
        groups[unit] = [];
      }
      groups[unit].push(payment);
      return groups;
    }, {} as Record<string, Payment[]>);
  };
  
  const groupedPayments = getGroupedPayments();
  const groupKeys = Object.keys(groupedPayments).sort((a, b) => {
    if (a === "") return -1;
    if (b === "") return 1;
    return parseInt(a) - parseInt(b);
  });
  
  const handleOpenPaymentForm = () => {
    setSelectedPayment(null);
    setIsPaymentFormOpen(true);
  };
  
  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentFormOpen(true);
  };
  
  const handleSavePayment = (payment: Payment) => {
    onUpdatePayment(payment);
    setIsPaymentFormOpen(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (onDeletePayment) {
      onDeletePayment(paymentId);
      setPaymentToDelete(null);
    }
  };

  const toggleView = () => {
    setCurrentView(currentView === "list" ? "grid" : "list");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Payments</h2>
        <div className="flex gap-2">
          {currentView === "list" && (
            <Select
              value={groupBy}
              onValueChange={(value) => setGroupBy(value as "none" | "unit")}
            >
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  <SelectValue placeholder="Group by..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="unit">Group by Unit</SelectItem>
              </SelectContent>
            </Select>
          )}
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
              {groupBy === "unit" && groupKeys.length > 0 ? (
                <div className="space-y-6">
                  {groupKeys.map((unit) => (
                    <div key={unit || "ungrouped"} className="mb-4">
                      {unit && (
                        <h3 className="text-lg font-medium px-4 py-2 bg-muted">
                          Unit {unit}
                        </h3>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedPayments[unit].length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No payments found
                              </TableCell>
                            </TableRow>
                          ) : (
                            groupedPayments[unit].map((payment) => (
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
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => handleEditPayment(payment)}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">Edit</span>
                                    </Button>
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Delete</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this payment? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() => handleDeletePayment(payment.id)}
                                          >
                                            Delete
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
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
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
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleEditPayment(payment)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this payment? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDeletePayment(payment.id)}
                                    >
                                      Delete
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
              )}
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
        onSave={handleSavePayment}
        payment={selectedPayment}
        tenants={tenants}
      />
    </div>
  );
}
