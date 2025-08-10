
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

      // Get payments data for income (annual)
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status, payment_date')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .gte('payment_date', yearStart)
        .lte('payment_date', yearEnd);

      // Get all accounting entries for analysis
      const { data: allEntries, error: entriesError } = await supabase
        .from('accounting_entries')
        .select('debit_amount, credit_amount, date, account_id, accounts(type, name)')
        .eq('user_id', user?.id)
        .gte('date', yearStart)
        .lte('date', yearEnd);

      console.log('AccountingReports: Raw data loaded:', {
        payments: payments?.length || 0,
        allEntries: allEntries?.length || 0,
        paymentsData: payments?.map(p => ({ amount: p.amount, date: p.payment_date, status: p.status })),
        entriesData: allEntries?.map(e => ({ 
          debit: e.debit_amount, 
          credit: e.credit_amount, 
          account_type: e.accounts?.type,
          account_name: e.accounts?.name 
        })),
        paymentsError,
        entriesError
      });

      const totalIncome = payments?.reduce((sum, payment) => {
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : (payment.amount || 0);
        return sum + amount;
      }, 0) || 0;
      
      // Calculate expenses from accounting entries - look for expense accounts or debit amounts
      const totalExpenses = allEntries?.reduce((sum, entry) => {
        const isExpenseAccount = entry.accounts?.type === 'expense';
        const debitAmount = typeof entry.debit_amount === 'string' ? parseFloat(entry.debit_amount) : (entry.debit_amount || 0);
        // For expense accounts, debit increases the expense
        return isExpenseAccount ? sum + debitAmount : sum;
      }, 0) || 0;

      console.log('AccountingReports: Calculated totals:', {
        totalIncome,
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
