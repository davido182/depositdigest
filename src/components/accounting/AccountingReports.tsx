
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Calculator, TrendingUp, PieChart } from "lucide-react";

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

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ingresos (Mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,200</div>
            <p className="text-xs text-muted-foreground">
              +12% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gastos (Mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8,950</div>
            <p className="text-xs text-muted-foreground">
              -5% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilidad Neta (Mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$36,250</div>
            <p className="text-xs text-muted-foreground">
              +18% vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
