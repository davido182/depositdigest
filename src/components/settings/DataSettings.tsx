import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Database, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function DataSettings() {
  const { user } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [showCodeVerification, setShowCodeVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const sendVerificationCode = async () => {
    if (!user?.email) {
      toast.error("No email address found for verification");
      return;
    }

    setIsSendingCode(true);
    try {
      const code = generateVerificationCode();
      setGeneratedCode(code);
      
      // In a real app, you would send this via email
      // For demo purposes, we'll show it in a toast
      toast.success(`Verification code sent to ${user.email}: ${code}`, {
        duration: 10000,
      });
      
      setShowCodeVerification(true);
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast.error("Failed to send verification code");
    } finally {
      setIsSendingCode(false);
    }
  };

  const clearAllData = async () => {
    if (!verificationCode || verificationCode !== generatedCode) {
      toast.error("Invalid verification code");
      return;
    }

    setIsClearing(true);
    try {
      // Clear all localStorage data including maintenance and accounting
      localStorage.removeItem('tenants');
      localStorage.removeItem('payments');
      localStorage.removeItem('maintenance_requests');
      localStorage.removeItem('accounts');
      localStorage.removeItem('accounting_entries');
      localStorage.removeItem('tax_entries');
      localStorage.removeItem('unit-count');
      localStorage.removeItem('totalUnits');
      
      // Keep user preferences
      // localStorage.removeItem('app-language');
      // localStorage.removeItem('app-theme');
      
      console.log('DataSettings: All application data cleared');
      toast.success("All data has been cleared successfully. The page will reload.");
      
      // Reset verification state
      setShowCodeVerification(false);
      setVerificationCode("");
      setGeneratedCode("");
      
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
      <CardContent className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-amber-600">⚠️</div>
            <div className="text-sm text-amber-800">
              <p className="font-medium">Warning: Data Deletion</p>
              <p>This action will permanently delete all your tenants, payments, maintenance requests, accounting data, and other application data. This cannot be undone.</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Security Verification Required</p>
              <p>For your protection, we'll send a verification code to your email before deleting your data.</p>
            </div>
          </div>
        </div>

        {!showCodeVerification ? (
          <Button 
            onClick={sendVerificationCode}
            disabled={isSendingCode}
            className="w-full"
            variant="outline"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isSendingCode ? "Sending Code..." : "Send Verification Code"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              <p className="text-sm text-muted-foreground">
                Check your email ({user?.email}) for the verification code
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={clearAllData}
                disabled={isClearing || !verificationCode}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isClearing ? "Clearing Data..." : "Confirm Delete All Data"}
              </Button>
              
              <Button 
                onClick={() => {
                  setShowCodeVerification(false);
                  setVerificationCode("");
                  setGeneratedCode("");
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
