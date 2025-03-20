
import React from "react";
import { Tenant, Payment } from "@/types";

interface TenantsPdfReportProps {
  tenants: Tenant[];
  payments: Payment[];
}

export const TenantsPdfReport = React.forwardRef<HTMLDivElement, TenantsPdfReportProps>(
  ({ tenants, payments }, ref) => {
    // Calculate total rent
    const totalRent = tenants.reduce((sum, tenant) => sum + tenant.rentAmount, 0);
    
    // Calculate total collected rent (from completed payments)
    const totalCollected = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);

    return (
      <div ref={ref} className="p-8 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Tenant Report</h1>
          <p className="text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <p className="text-sm text-gray-500">Total Tenants</p>
              <p className="text-2xl font-bold">{tenants.length}</p>
            </div>
            <div className="p-4 border rounded">
              <p className="text-sm text-gray-500">Total Monthly Rent</p>
              <p className="text-2xl font-bold">${totalRent.toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded">
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold">${totalCollected.toLocaleString()}</p>
            </div>
            <div className="p-4 border rounded">
              <p className="text-sm text-gray-500">Occupancy Rate</p>
              <p className="text-2xl font-bold">
                {tenants.filter(t => t.status === 'active').length} / {tenants.length}
              </p>
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-2">Tenant Details</h2>
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Unit</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Rent</th>
              <th className="border p-2 text-left">Move In</th>
              <th className="border p-2 text-left">Lease End</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="border p-2">{tenant.name}</td>
                <td className="border p-2">{tenant.unit}</td>
                <td className="border p-2 capitalize">{tenant.status}</td>
                <td className="border p-2">${tenant.rentAmount.toLocaleString()}</td>
                <td className="border p-2">{tenant.moveInDate}</td>
                <td className="border p-2">{tenant.leaseEndDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-8 text-xs text-gray-500 text-center">
          <p>This report is generated automatically and is confidential.</p>
        </div>
      </div>
    );
  }
);

TenantsPdfReport.displayName = "TenantsPdfReport";
