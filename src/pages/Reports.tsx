
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DatabaseService from "@/services/DatabaseService";
import { Tenant, Payment } from "@/types";
import { FileDown, PieChart, Filter } from "lucide-react";

const Reports = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const dbService = DatabaseService.getInstance();
        const loadedTenants = await dbService.getTenants();
        const loadedPayments = await dbService.getPayments();
        
        setTenants(loadedTenants);
        setPayments(loadedPayments);
      } catch (error) {
        console.error("Error loading report data:", error);
        toast.error("Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const generateOccupancyReport = () => {
    const activeCount = tenants.filter(t => t.status === 'active').length;
    const totalUnits = tenants.length;
    const occupancyRate = totalUnits > 0 ? (activeCount / totalUnits * 100).toFixed(1) : "0";
    
    toast.success(`Generated Occupancy Report: ${occupancyRate}% occupancy rate`);
  };

  const generateRentCollectionReport = () => {
    const totalRent = tenants.reduce((sum, tenant) => sum + tenant.rentAmount, 0);
    const collectedRent = payments.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
    const collectionRate = totalRent > 0 ? (collectedRent / totalRent * 100).toFixed(1) : "0";
    
    toast.success(`Generated Rent Collection Report: ${collectionRate}% collection rate`);
  };

  const exportTenantData = () => {
    try {
      // Create CSV content
      const header = "Name,Email,Unit,Status,Rent Amount\n";
      const rows = tenants.map(tenant => 
        `${tenant.name},${tenant.email},${tenant.unit},${tenant.status},${tenant.rentAmount}`
      ).join("\n");
      
      const csvContent = `data:text/csv;charset=utf-8,${header}${rows}`;
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "tenants_report.csv");
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      document.body.removeChild(link);
      
      toast.success("Tenants data exported successfully");
    } catch (error) {
      console.error("Error exporting tenant data:", error);
      toast.error("Failed to export tenant data");
    }
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        
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
                    <h2 className="text-xl font-semibold">Occupancy Report</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Overview of unit occupancy status
                    </p>
                  </div>
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
                <Button 
                  onClick={generateOccupancyReport} 
                  className="w-full mt-4"
                >
                  Generate Report
                </Button>
              </Card>
              
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Rent Collection</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Track rent payments and collection rates
                    </p>
                  </div>
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <Button 
                  onClick={generateRentCollectionReport} 
                  className="w-full mt-4"
                >
                  Generate Report
                </Button>
              </Card>
            </div>
            
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Export Data</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Download tenant and payment data for external analysis
                  </p>
                </div>
                <FileDown className="h-6 w-6 text-primary" />
              </div>
              <Button 
                onClick={exportTenantData} 
                className="w-full mt-4"
                variant="outline"
              >
                Export Tenant Data
              </Button>
            </Card>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Reports;
