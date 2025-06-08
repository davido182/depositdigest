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
    if (!reportRef.current) return;

    try {
      // Sort tenants by unit number before generating PDF
      const sortedTenants = [...tenants].sort((a, b) => {
        const unitA = parseInt(a.unit) || 0;
        const unitB = parseInt(b.unit) || 0;
        return unitA - unitB;
      });

      const pdf = new jsPDF();
      const element = reportRef.current;
      
      // Create a temporary element with sorted data
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Tenants Report</h1>
          <p style="text-align: center; color: #666; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString()}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Unit</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Email</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Status</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Rent</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Move In</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Lease End</th>
              </tr>
            </thead>
            <tbody>
              ${sortedTenants.map(tenant => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${tenant.unit}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${tenant.name}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${tenant.email}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; 
                      background-color: ${tenant.status === 'active' ? '#dcfce7' : 
                                        tenant.status === 'late' ? '#fef3c7' : 
                                        tenant.status === 'notice' ? '#fde68a' : '#f3f4f6'};
                      color: ${tenant.status === 'active' ? '#166534' : 
                               tenant.status === 'late' ? '#92400e' : 
                               tenant.status === 'notice' ? '#92400e' : '#374151'};">
                      ${tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                    </span>
                  </td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${tenant.rentAmount.toLocaleString()}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${new Date(tenant.moveInDate).toLocaleDateString()}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3 style="color: #333; margin-bottom: 15px;">Summary</h3>
            <p><strong>Total Tenants:</strong> ${sortedTenants.length}</p>
            <p><strong>Active:</strong> ${sortedTenants.filter(t => t.status === 'active').length}</p>
            <p><strong>Late:</strong> ${sortedTenants.filter(t => t.status === 'late').length}</p>
            <p><strong>Notice:</strong> ${sortedTenants.filter(t => t.status === 'notice').length}</p>
            <p><strong>Total Monthly Revenue:</strong> $${sortedTenants.reduce((sum, t) => sum + t.rentAmount, 0).toLocaleString()}</p>
          </div>
        </div>
      `;
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`tenants_report_${new Date().toISOString().split('T')[0]}.pdf`);
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
