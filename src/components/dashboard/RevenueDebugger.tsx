import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export function RevenueDebugger() {
  const { user } = useAuth();

  const getDebugInfo = () => {
    if (!user?.id) return null;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Get payment records
    const storageKey = `payment_records_${user.id}_${currentYear}`;
    const storedRecords = localStorage.getItem(storageKey);
    
    let debugInfo = {
      storageKey,
      hasRecords: !!storedRecords,
      recordsCount: 0,
      currentMonthRecords: [],
      totalCurrentMonth: 0,
      sampleRecords: []
    };

    if (storedRecords) {
      try {
        const records = JSON.parse(storedRecords);
        debugInfo.recordsCount = records.length;
        
        const currentMonthRecords = records.filter((r: any) => 
          r.year === currentYear && r.month === currentMonth && r.paid
        );
        
        debugInfo.currentMonthRecords = currentMonthRecords;
        debugInfo.totalCurrentMonth = currentMonthRecords.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        debugInfo.sampleRecords = records.slice(0, 3);
      } catch (error) {
        console.error('Error parsing records:', error);
      }
    }

    return debugInfo;
  };

  const debugInfo = getDebugInfo();

  if (!debugInfo) return null;

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm text-orange-800">🔍 Debug: Revenue Calculation</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div><strong>Storage Key:</strong> {debugInfo.storageKey}</div>
        <div><strong>Has Records:</strong> {debugInfo.hasRecords ? '✅' : '❌'}</div>
        <div><strong>Total Records:</strong> {debugInfo.recordsCount}</div>
        <div><strong>Current Month Paid:</strong> {debugInfo.currentMonthRecords.length}</div>
        <div><strong>Current Month Revenue:</strong> €{debugInfo.totalCurrentMonth}</div>
        
        {debugInfo.sampleRecords.length > 0 && (
          <div>
            <strong>Sample Records:</strong>
            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(debugInfo.sampleRecords, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}