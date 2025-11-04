import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DatabaseService } from "@/services/DatabaseService";
import { Tenant, Payment } from "@/types";
import { FileDown, FileText as FilePdfIcon, PieChart, Filter } from "lucide-react";
import { TenantsPdfReport } from "@/components/reports/TenantsPdfReport";

const Reports = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [occupancyRate, setOccupancyRate] = useState<string>("0");
  const [collectionRate, setCollectionRate] = useState<string>("0");
  const [totalUnits, setTotalUnits] = useState(20);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dbService = DatabaseService.getInstance();
        const loadedTenants = await dbService.getTenants();
        const loadedPayments = await dbService.getPayments();
        const units = dbService.getTotalUnits();
        
        setTenants(loadedTenants);
        setPayments(loadedPayments);
        setTotalUnits(units);
        
        calculateOccupancy(loadedTenants, units);
        calculateRentCollection(loadedTenants, loadedPayments);
      } catch (error) {
        console.error("Error loading report data:", error);
        toast.error("Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateOccupancy = (currentTenants: Tenant[], units: number) => {
    const activeCount = currentTenants.filter(t => t.status === 'active').length;
    const rate = units > 0 ? (activeCount / units * 100).toFixed(1) : "0";
    setOccupancyRate(rate);
    return rate;
  };

  const calculateRentCollection = (currentTenants: Tenant[], currentPayments: Payment[]) => {
    const totalRent = currentTenants.reduce((sum, tenant) => sum + (tenant.rentAmount || 0), 0);
    const collectedRent = currentPayments.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
    const rate = totalRent > 0 ? (collectedRent / totalRent * 100).toFixed(1) : "0";
    setCollectionRate(rate);
    return rate;
  };

  const generateOccupancyReport = () => {
    const rate = calculateOccupancy(tenants, totalUnits);
    
    toast.success(`Reporte de Ocupación: ${rate}% de ocupación`);
    
    const activeCount = tenants.filter(t => t.status === 'active').length;
    const noticeCount = tenants.filter(t => t.status === 'notice').length;
    const inactiveCount = tenants.filter(t => t.status === 'inactive').length;
    const lateCount = tenants.filter(t => t.status === 'late').length;
    
    console.log({
      total: totalUnits,
      active: activeCount,
      notice: noticeCount,
      inactive: inactiveCount,
      late: lateCount,
      occupancyRate: rate
    });
  };

  const generateRentCollectionReport = () => {
    const rate = calculateRentCollection(tenants, payments);
    
    toast.success(`Reporte de Cobros: ${rate}% de cobro efectivo`);
    
    const totalRent = tenants.reduce((sum, tenant) => sum + (tenant.rentAmount || 0), 0);
    const collectedRent = payments.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
    const pendingRent = payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
    
    console.log({
      totalRent,
      collectedRent,
      pendingRent,
      collectionRate: rate
    });
  };

  const exportTenantData = () => {
    try {
      const dbService = DatabaseService.getInstance();
      dbService.getTenants().then(latestTenants => {
        const header = "Nombre,Email,Unidad,Estado,Renta Mensual,Fecha Ingreso,Fin de Contrato\n";
        const rows = latestTenants.map(tenant => 
          `${tenant.name},${tenant.email || 'N/A'},${tenant.unit || 'N/A'},${tenant.status},${tenant.rentAmount},${tenant.moveInDate || 'N/A'},${tenant.leaseEndDate || 'N/A'}`
        ).join("\n");
        
        const csvContent = `data:text/csv;charset=utf-8,${header}${rows}`;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inquilinos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        
        toast.success("Datos de inquilinos exportados exitosamente");
      }).catch(error => {
        console.error("Error fetching latest tenant data:", error);
        toast.error("Error al exportar datos de inquilinos");
      });
    } catch (error) {
      console.error("Error exporting tenant data:", error);
      toast.error("Error al exportar datos de inquilinos");
    }
  };

  const exportPaymentData = () => {
    try {
      const dbService = DatabaseService.getInstance();
      dbService.getPayments().then(latestPayments => {
        const header = "Fecha,ID Inquilino,Monto,Estado,Método,Concepto\n";
        const rows = latestPayments.map(payment => 
          `${payment.date || 'N/A'},${payment.tenantId || 'N/A'},${payment.amount},${payment.status},${payment.method || 'N/A'},Renta mensual`
        ).join("\n");
        
        const csvContent = `data:text/csv;charset=utf-8,${header}${rows}`;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `pagos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        
        toast.success("Datos de pagos exportados exitosamente");
      }).catch(error => {
        console.error("Error fetching payment data:", error);
        toast.error("Error al exportar datos de pagos");
      });
    } catch (error) {
      console.error("Error exporting payment data:", error);
      toast.error("Error al exportar datos de pagos");
    }
  };

  const exportPaymentsPDF = () => {
    toast.info("Generando reporte PDF de pagos...");
    // TODO: Implementar generación de PDF para pagos
    setTimeout(() => {
      toast.success("Reporte PDF de pagos generado (funcionalidad en desarrollo)");
    }, 1500);
  };

  const exportPropertiesData = () => {
    try {
      // Simular datos de propiedades basados en inquilinos
      const properties = tenants.reduce((acc: any[], tenant) => {
        if (tenant.unit && !acc.find(p => p.unit === tenant.unit)) {
          acc.push({
            unit: tenant.unit,
            tenant: tenant.name,
            status: tenant.status,
            rent: tenant.rentAmount,
            moveIn: tenant.moveInDate,
            leaseEnd: tenant.leaseEndDate
          });
        }
        return acc;
      }, []);

      const header = "Unidad,Inquilino Actual,Estado,Renta Mensual,Fecha Ingreso,Fin Contrato\n";
      const rows = properties.map(property => 
        `${property.unit},${property.tenant},${property.status},${property.rent},${property.moveIn || 'N/A'},${property.leaseEnd || 'N/A'}`
      ).join("\n");
      
      const csvContent = `data:text/csv;charset=utf-8,${header}${rows}`;
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `propiedades_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      toast.success("Datos de propiedades exportados exitosamente");
    } catch (error) {
      console.error("Error exporting properties data:", error);
      toast.error("Error al exportar datos de propiedades");
    }
  };

  const exportPropertiesPDF = () => {
    toast.info("Generando reporte PDF de propiedades...");
    // TODO: Implementar generación de PDF para propiedades
    setTimeout(() => {
      toast.success("Reporte PDF de propiedades generado (funcionalidad en desarrollo)");
    }, 1500);
  };

  const downloadTenantTemplate = () => {
    const header = "Nombre,Email,Unidad,Estado,Renta Mensual,Fecha Ingreso,Fin de Contrato\n";
    const example = "Juan Pérez,juan@email.com,A-101,active,1200,2024-01-15,2024-12-31\n";
    const csvContent = `data:text/csv;charset=utf-8,${header}${example}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_inquilinos.csv");
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    toast.success("Plantilla de inquilinos descargada");
  };

  const downloadPaymentTemplate = () => {
    const header = "Fecha,Inquilino,Monto,Estado,Método,Concepto\n";
    const example = "2024-01-15,Juan Pérez,1200,completed,transfer,Renta enero\n";
    const csvContent = `data:text/csv;charset=utf-8,${header}${example}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_pagos.csv");
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    toast.success("Plantilla de pagos descargada");
  };

  const downloadPropertyTemplate = () => {
    const header = "Unidad,Inquilino Actual,Estado,Renta Mensual,Fecha Ingreso,Fin Contrato\n";
    const example = "A-101,Juan Pérez,active,1200,2024-01-15,2024-12-31\n";
    const csvContent = `data:text/csv;charset=utf-8,${header}${example}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_propiedades.csv");
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    toast.success("Plantilla de propiedades descargada");
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reportes</h1>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Reporte de Ocupación</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Tasa de ocupación actual: {occupancyRate}%
                    </p>
                  </div>
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
                <Button 
                  onClick={generateOccupancyReport} 
                  className="w-full mt-4"
                >
                  Generar Reporte
                </Button>
              </Card>
              
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Reporte de Cobros</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Tasa de cobro actual: {collectionRate}%
                    </p>
                  </div>
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <Button 
                  onClick={generateRentCollectionReport} 
                  className="w-full mt-4"
                >
                  Generar Reporte
                </Button>
              </Card>
            </div>
            
            {/* Exportar Datos de Inquilinos */}
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Exportar Datos de Inquilinos</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Descargar información de inquilinos para análisis externo
                  </p>
                </div>
                <FileDown className="h-6 w-6 text-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Button 
                  onClick={exportTenantData} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar CSV
                </Button>
                <TenantsPdfReport tenants={tenants} />
              </div>
            </Card>

            {/* Exportar Datos de Pagos */}
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Exportar Datos de Pagos</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Descargar historial de pagos y transacciones
                  </p>
                </div>
                <FileDown className="h-6 w-6 text-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Button 
                  onClick={exportPaymentData} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar CSV
                </Button>
                <Button 
                  onClick={exportPaymentsPDF} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FilePdfIcon className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </Card>

            {/* Exportar Datos de Propiedades */}
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Exportar Datos de Propiedades</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Descargar información de propiedades y unidades
                  </p>
                </div>
                <FileDown className="h-6 w-6 text-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Button 
                  onClick={exportPropertiesData} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar CSV
                </Button>
                <Button 
                  onClick={exportPropertiesPDF} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FilePdfIcon className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </Card>

            {/* Plantilla de Importación */}
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Plantillas de Importación</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Descargar plantillas vacías para importar datos
                  </p>
                </div>
                <FileDown className="h-6 w-6 text-primary" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Button 
                  onClick={downloadTenantTemplate} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Plantilla Inquilinos
                </Button>
                <Button 
                  onClick={downloadPaymentTemplate} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Plantilla Pagos
                </Button>
                <Button 
                  onClick={downloadPropertyTemplate} 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Plantilla Propiedades
                </Button>
              </div>
            </Card>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Reports;
