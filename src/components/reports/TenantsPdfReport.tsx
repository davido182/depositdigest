
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { FileText as FilePdfIcon } from "lucide-react";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from "sonner";
import { Tenant } from '@/types';

interface TenantsPdfReportProps {
  tenants: Tenant[];
}

export function TenantsPdfReport({ tenants }: TenantsPdfReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    try {
      // Sort tenants by unit number before generating PDF
      const sortedTenants = [...tenants].sort((a, b) => {
        const unitA = parseInt(a.unit || '0') || 0;
        const unitB = parseInt(b.unit || '0') || 0;
        return unitA - unitB;
      });

      const pdf = new jsPDF();
      
      // Create HTML content for the PDF without using html2canvas
      const htmlContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 800px;">
          <h1 style="color: #333; text-align: center; margin-bottom: 30px; font-size: 24px;">Tenants Report</h1>
          <p style="text-align: center; color: #666; margin-bottom: 30px; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Unit</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Email</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rent</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Move In</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Lease End</th>
              </tr>
            </thead>
            <tbody>
              ${sortedTenants.map(tenant => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${tenant.unit || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${tenant.name || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${tenant.email || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${tenant.status || 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">$${(tenant.rentAmount || 0).toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : 'N/A'}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">${tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">Summary</h3>
            <p style="margin: 5px 0;"><strong>Total Tenants:</strong> ${sortedTenants.length}</p>
            <p style="margin: 5px 0;"><strong>Active:</strong> ${sortedTenants.filter(t => t.status === 'active').length}</p>
            <p style="margin: 5px 0;"><strong>Late:</strong> ${sortedTenants.filter(t => t.status === 'late').length}</p>
            <p style="margin: 5px 0;"><strong>Notice:</strong> ${sortedTenants.filter(t => t.status === 'notice').length}</p>
            <p style="margin: 5px 0;"><strong>Total Monthly Revenue:</strong> $${sortedTenants.reduce((sum, t) => sum + (t.rentAmount || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      `;
      
      // Use jsPDF's html method instead of html2canvas
      await pdf.html(htmlContent, {
        callback: function (doc) {
          doc.save(`tenants_report_${new Date().toISOString().split('T')[0]}.pdf`);
        },
        x: 10,
        y: 10,
        width: 190,
        windowWidth: 800
      });
      
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <>
      <Button 
        onClick={generatePDF} 
        variant="outline"
        className="w-full flex items-center gap-2"
      >
        <FilePdfIcon className="h-4 w-4" />
        Export Tenants PDF
      </Button>
      
      <div ref={reportRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {/* Hidden content for PDF generation */}
      </div>
    </>
  );
}
