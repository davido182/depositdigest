
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Database } from "lucide-react";
import { toast } from "sonner";

export function DataSettings() {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllData = async () => {
    setIsClearing(true);
    try {
      // Clear all localStorage data
      localStorage.removeItem('tenants');
      localStorage.removeItem('payments');
      localStorage.removeItem('maintenance_requests');
      localStorage.removeItem('accounts');
      localStorage.removeItem('accounting_entries');
      localStorage.removeItem('tax_entries');
      localStorage.removeItem('unit-count');
      localStorage.removeItem('app-language');
      localStorage.removeItem('app-theme');
      
      console.log('DataSettings: All application data cleared');
      toast.success("All data has been cleared successfully. The page will reload.");
      
      // Reload the page to reset all components
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error("Error clearing data. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Management
        </CardTitle>
        <CardDescription>
          Manage your application data and reset to start fresh
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-amber-600">⚠️</div>
            <div className="text-sm text-amber-800">
              <p className="font-medium">Warning: Data Deletion</p>
              <p>This action will permanently delete all your tenants, payments, maintenance requests, and other data. This cannot be undone.</p>
            </div>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              disabled={isClearing}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? "Clearing Data..." : "Clear All Data"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete all your data including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All tenant information</li>
                  <li>All payment records</li>
                  <li>All maintenance requests</li>
                  <li>All accounting data</li>
                  <li>Application settings</li>
                </ul>
                <br />
                This action cannot be undone and you will start with a completely clean application.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={clearAllData}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Clear All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
