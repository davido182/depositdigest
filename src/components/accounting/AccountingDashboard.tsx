
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsList } from "./AccountsList";
import { AccountingEntriesList } from "./AccountingEntriesList";
import { TaxEntriesList } from "./TaxEntriesList";
import { FinancialStatements } from "./FinancialStatements";
import { AccountingReports } from "./AccountingReports";

export function AccountingDashboard() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="entries">Asientos</TabsTrigger>
          <TabsTrigger value="statements">Estados Financieros</TabsTrigger>
          <TabsTrigger value="taxes">Impuestos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AccountingReports />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <AccountsList />
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          <AccountingEntriesList />
        </TabsContent>

        <TabsContent value="statements" className="space-y-6">
          <FinancialStatements />
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          <TaxEntriesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
