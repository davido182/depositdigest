
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MaintenanceRequest } from "@/types";
import { Layout } from "@/components/Layout";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import { MaintenanceRequestForm } from "@/components/maintenance/MaintenanceRequestForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";

const Maintenance = () => {
  const [showForm, setShowForm] = useState(false);
  
  // This would be replaced with an actual API call in a real implementation
  const { data: maintenanceRequests, isLoading, error } = useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: async () => {
      // Simulated data for now
      return [
        {
          id: "mr1",
          tenantId: "t1",
          unit: "101",
          title: "Leaking Faucet",
          description: "The kitchen faucet is leaking water constantly.",
          category: "plumbing",
          priority: "medium",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "mr2",
          tenantId: "t2",
          unit: "202",
          title: "Broken Heater",
          description: "The central heating is not working.",
          category: "heating",
          priority: "high",
          status: "in_progress",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: "John Technician"
        }
      ] as MaintenanceRequest[];
    }
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Requests</h1>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New Request
          </Button>
        </div>
        
        {showForm ? (
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Create Maintenance Request</h2>
            <MaintenanceRequestForm 
              onSubmit={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <MaintenanceRequestList 
                requests={maintenanceRequests || []} 
                isLoading={isLoading}
                error={error ? String(error) : undefined}
              />
            </TabsContent>
            <TabsContent value="pending">
              <MaintenanceRequestList 
                requests={(maintenanceRequests || []).filter(r => r.status === 'pending')} 
                isLoading={isLoading}
                error={error ? String(error) : undefined}
              />
            </TabsContent>
            <TabsContent value="in_progress">
              <MaintenanceRequestList 
                requests={(maintenanceRequests || []).filter(r => r.status === 'in_progress' || r.status === 'assigned')} 
                isLoading={isLoading}
                error={error ? String(error) : undefined}
              />
            </TabsContent>
            <TabsContent value="completed">
              <MaintenanceRequestList 
                requests={(maintenanceRequests || []).filter(r => r.status === 'completed')} 
                isLoading={isLoading}
                error={error ? String(error) : undefined}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Maintenance;
