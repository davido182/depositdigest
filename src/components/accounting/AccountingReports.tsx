
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Calculator, TrendingUp, PieChart } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Component to show real accounting stats
function AccountingStatsCards() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0
  });

  useEffect(() => {
    if (user) {
      loadAccountingStats();
    }
  }, [user]);

  const loadAccountingStats = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      // Load data in parallel
      const [receiptsRes, tenantsRes, entriesRes, taxesRes] = await Promise.all([
        // Payment tracking (income proxy)
        supabase
          .from('payment_receipts')
          .select('tenant_id, year, month, has_receipt')
          .eq('user_id', user?.id)
          .eq('year', currentYear)
          .eq('has_receipt', true),
        // Tenants to derive monthly rent per tenant
        supabase
          .from('tenants')
          .select('id, rent_amount')
          .eq('user_id', user?.id),
        // All accounting entries (expenses)
        supabase
          .from('accounting_entries')
          .select('debit_amount, credit_amount, date, account_id, accounts(type, name)')
          .eq('user_id', user?.id)
          .gte('date', yearStart)
          .lte('date', yearEnd),
        // Taxes configured
        supabase
          .from('tax_entries')
          .select('tax_amount, status, date')
          .eq('user_id', user?.id)
          .gte('date', yearStart)
          .lte('date', yearEnd)
      ]);

      console.log('AccountingReports: Raw data loaded:', {
        receipts: receiptsRes.data?.length || 0,
        tenants: tenantsRes.data?.length || 0,
        entries: entriesRes.data?.length || 0,
        taxes: taxesRes.data?.length || 0,
        errors: { receiptsError: receiptsRes.error, tenantsError: tenantsRes.error, entriesError: entriesRes.error, taxesError: taxesRes.error }
      });

      if (receiptsRes.error) throw receiptsRes.error;
      if (tenantsRes.error) throw tenantsRes.error;
      if (entriesRes.error) throw entriesRes.error;
      if (taxesRes.error) throw taxesRes.error;

      const receipts = receiptsRes.data || [];
      const tenants = tenantsRes.data || [];
      const allEntries = entriesRes.data || [];
      const taxes = taxesRes.data || [];

      // Map tenant rent amount
      const tenantRentMap = new Map<string, number>();
      tenants.forEach((t: any) => {
        const rent = typeof t.rent_amount === 'string' ? parseFloat(t.rent_amount) : (t.rent_amount || 0);
        tenantRentMap.set(t.id, rent);
      });

      // Income: sum rent for each receipt marked as paid
      const totalIncome = receipts.reduce((sum: number, r: any) => {
        const rent = tenantRentMap.get(r.tenant_id) || 0;
        return sum + rent;
      }, 0);

      // Expenses from accounting entries: sum debits of expense accounts
      const totalAccountingExpenses = allEntries.reduce((sum: number, entry: any) => {
        const isExpense = entry.accounts?.type === 'expense';
        const debitAmount = typeof entry.debit_amount === 'string' ? parseFloat(entry.debit_amount) : (entry.debit_amount || 0);
        return isExpense ? sum + debitAmount : sum;
      }, 0);

      // Taxes expenses
      const totalTaxes = taxes.reduce((sum: number, t: any) => {
        const tax = typeof t.tax_amount === 'string' ? parseFloat(t.tax_amount) : (t.tax_amount || 0);
        return sum + tax;
      }, 0);

      const totalExpenses = totalAccountingExpenses + totalTaxes;

      console.log('AccountingReports: Calculated totals:', {
        totalIncome,
        totalAccountingExpenses,
        totalTaxes,
        totalExpenses,
        netProfit: totalIncome - totalExpenses
      });
      
      setStats({
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses
      });
    } catch (error) {
      console.error('Error loading accounting stats:', error);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Ingresos (Año)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{stats.totalIncome.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Basado en pagos completados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Gastos (Año)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{stats.totalExpenses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Basado en entradas contables
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Utilidad Neta (Año)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            €{stats.netProfit.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Ingresos - Gastos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccountingReports() {
  const reports = [
    {
      title: "Balance General",
      description: "Estado de situación financiera con activos, pasivos y patrimonio",
      icon: Calculator,
      action: "Generar Balance"
    },
    {
      title: "Estado de Resultados",
      description: "Informe de ingresos y gastos del período",
      icon: TrendingUp,
      action: "Generar Estado"
    },
    {
      title: "Libro Diario",
      description: "Registro cronológico de todos los asientos contables",
      icon: FileDown,
      action: "Exportar Libro"
    },
    {
      title: "Reporte de Impuestos",
      description: "Resumen de impuestos por período para declaraciones",
      icon: PieChart,
      action: "Generar Reporte"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Reportes Contables</h2>
        <p className="text-muted-foreground">
          Genera reportes financieros y contables para análisis e impuestos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2">
                <FileDown className="h-4 w-4" />
                {report.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AccountingStatsCards />
    </div>
  );
}
