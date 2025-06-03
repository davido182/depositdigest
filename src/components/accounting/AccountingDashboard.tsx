
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsList } from "./AccountsList";
import { AccountingEntriesList } from "./AccountingEntriesList";
import { TaxEntriesList } from "./TaxEntriesList";
import { AccountingReports } from "./AccountingReports";

export function AccountingDashboard() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entries">Asientos Contables</TabsTrigger>
          <TabsTrigger value="accounts">Plan de Cuentas</TabsTrigger>
          <TabsTrigger value="taxes">Impuestos</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entries" className="space-y-4">
          <AccountingEntriesList />
        </TabsContent>
        
        <TabsContent value="accounts" className="space-y-4">
          <AccountsList />
        </TabsContent>
        
        <TabsContent value="taxes" className="space-y-4">
          <TaxEntriesList />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <AccountingReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
