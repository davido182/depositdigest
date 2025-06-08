
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, FileDown } from "lucide-react";
import DatabaseService from "@/services/DatabaseService";
import { Account, AccountingEntry } from "@/types";
import { toast } from "sonner";

interface BalanceSheetItem {
  name: string;
  amount: number;
  type: 'asset' | 'liability' | 'equity';
}

interface IncomeStatementItem {
  name: string;
  amount: number;
  type: 'revenue' | 'expense';
}

export function FinancialStatements() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const dbService = DatabaseService.getInstance();
      const [accountsData, entriesData] = await Promise.all([
        dbService.getAccounts(),
        dbService.getAccountingEntries()
      ]);
      
      // Filter entries by selected period
      const filteredEntries = filterEntriesByPeriod(entriesData, selectedPeriod);
      
      setAccounts(accountsData);
      setEntries(filteredEntries);
    } catch (error) {
      console.error("Error loading financial data:", error);
      toast.error("Error loading financial data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntriesByPeriod = (entries: AccountingEntry[], period: string): AccountingEntry[] => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        return entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate <= endDate;
        });
      case "current_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "last_year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        const yearEndDate = new Date(now.getFullYear() - 1, 11, 31);
        return entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate <= yearEndDate;
        });
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return entries.filter(entry => new Date(entry.date) >= startDate);
  };

  const calculateBalanceSheet = (): BalanceSheetItem[] => {
    const balanceSheet: BalanceSheetItem[] = [];
    
    accounts.forEach(account => {
      const accountEntries = entries.filter(entry => entry.account_id === account.id);
      const totalDebits = accountEntries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
      const totalCredits = accountEntries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);
      
      let balance = 0;
      if (account.type === 'asset') {
        balance = totalDebits - totalCredits;
      } else {
        balance = totalCredits - totalDebits;
      }
      
      if (balance !== 0) {
        balanceSheet.push({
          name: account.name,
          amount: balance,
          type: account.type as 'asset' | 'liability' | 'equity'
        });
      }
    });
    
    return balanceSheet;
  };

  const calculateIncomeStatement = (): IncomeStatementItem[] => {
    const incomeStatement: IncomeStatementItem[] = [];
    
    accounts.forEach(account => {
      if (account.type === 'revenue' || account.type === 'expense') {
        const accountEntries = entries.filter(entry => entry.account_id === account.id);
        const totalCredits = accountEntries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);
        const totalDebits = accountEntries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
        
        let amount = 0;
        if (account.type === 'revenue') {
          amount = totalCredits - totalDebits;
        } else {
          amount = totalDebits - totalCredits;
        }
        
        if (amount !== 0) {
          incomeStatement.push({
            name: account.name,
            amount: amount,
            type: account.type as 'revenue' | 'expense'
          });
        }
      }
    });
    
    return incomeStatement;
  };

  const exportBalanceSheet = () => {
    const balanceSheet = calculateBalanceSheet();
    const assets = balanceSheet.filter(item => item.type === 'asset');
    const liabilities = balanceSheet.filter(item => item.type === 'liability');
    const equity = balanceSheet.filter(item => item.type === 'equity');
    
    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to generate PDF");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Balance Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .section { margin: 20px 0; }
          .total { font-weight: bold; background-color: #f9f9f9; }
          .amount { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Balance Sheet</h1>
        <p><strong>Period:</strong> ${selectedPeriod.replace('_', ' ').toUpperCase()}</p>
        <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
        
        <div class="section">
          <h2>Assets</h2>
          <table>
            ${assets.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="amount">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td>Total Assets</td>
              <td class="amount">$${totalAssets.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Liabilities</h2>
          <table>
            ${liabilities.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="amount">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td>Total Liabilities</td>
              <td class="amount">$${totalLiabilities.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Equity</h2>
          <table>
            ${equity.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="amount">$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td>Total Equity</td>
              <td class="amount">$${totalEquity.toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const exportIncomeStatement = () => {
    const incomeStatement = calculateIncomeStatement();
    const revenues = incomeStatement.filter(item => item.type === 'revenue');
    const expenses = incomeStatement.filter(item => item.type === 'expense');
    
    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to generate PDF");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Income Statement</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; background-color: #f9f9f9; }
          .net-income { font-weight: bold; background-color: #e8f5e8; }
          .amount { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Income Statement</h1>
        <p><strong>Period:</strong> ${selectedPeriod.replace('_', ' ').toUpperCase()}</p>
        <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
        
        <table>
          <tr><th>Revenue</th><th></th></tr>
          ${revenues.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="amount">$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total">
            <td>Total Revenue</td>
            <td class="amount">$${totalRevenue.toFixed(2)}</td>
          </tr>
          
          <tr><th>Expenses</th><th></th></tr>
          ${expenses.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="amount">$${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr class="total">
            <td>Total Expenses</td>
            <td class="amount">$${totalExpenses.toFixed(2)}</td>
          </tr>
          
          <tr class="net-income">
            <td>Net Income</td>
            <td class="amount">$${netIncome.toFixed(2)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const balanceSheet = calculateBalanceSheet();
  const incomeStatement = calculateIncomeStatement();
  
  const assets = balanceSheet.filter(item => item.type === 'asset');
  const liabilities = balanceSheet.filter(item => item.type === 'liability');
  const equity = balanceSheet.filter(item => item.type === 'equity');
  
  const revenues = incomeStatement.filter(item => item.type === 'revenue');
  const expenses = incomeStatement.filter(item => item.type === 'expense');
  
  const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);
  
  const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Financial Statements</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Current Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="current_year">Current Year</SelectItem>
            <SelectItem value="last_year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Sheet */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>Assets, Liabilities & Equity</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportBalanceSheet}>
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Assets */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">ASSETS</h4>
              {assets.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t font-semibold">
                <span>Total Assets</span>
                <span>${totalAssets.toFixed(2)}</span>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">LIABILITIES</h4>
              {liabilities.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t font-semibold">
                <span>Total Liabilities</span>
                <span>${totalLiabilities.toFixed(2)}</span>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">EQUITY</h4>
              {equity.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t font-semibold">
                <span>Total Equity</span>
                <span>${totalEquity.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Statement */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Income Statement</CardTitle>
              <CardDescription>Revenue & Expenses</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportIncomeStatement}>
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Revenue */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">REVENUE</h4>
              {revenues.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium text-green-600">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t font-semibold">
                <span>Total Revenue</span>
                <span className="text-green-600">${totalRevenue.toFixed(2)}</span>
              </div>
            </div>

            {/* Expenses */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">EXPENSES</h4>
              {expenses.map((item, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm font-medium text-red-600">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t font-semibold">
                <span>Total Expenses</span>
                <span className="text-red-600">${totalExpenses.toFixed(2)}</span>
              </div>
            </div>

            {/* Net Income */}
            <div className="bg-muted p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Net Income</span>
                <div className="flex items-center gap-2">
                  {netIncome >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netIncome.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
