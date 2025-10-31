import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// This component automatically creates accounting entries when payments are made
export function AutomatedAccountingIntegration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for new payments
    const paymentsSubscription = supabase
      .channel('payments_accounting')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          // Removed console.log for security
          await createAccountingEntriesForPayment(payload.new);
        }
      )
      .subscribe();

    return () => {
      paymentsSubscription.unsubscribe();
    };
  }, [user]);

  const createAccountingEntriesForPayment = async (payment: any) => {
    try {
      // Get or create necessary accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id);

      // Create cash/bank account if it doesn't exist
      let cashAccount = accounts?.find(a => a.code === '1000');
      if (!cashAccount) {
        const { data: newCashAccount } = await supabase
          .from('accounts')
          .insert({
            user_id: user?.id,
            code: '1000',
            name: 'Efectivo y Bancos',
            type: 'asset',
            description: 'Cuenta de efectivo y depósitos bancarios'
          })
          .select()
          .single();
        cashAccount = newCashAccount;
      }

      // Create rental income account if it doesn't exist
      let incomeAccount = accounts?.find(a => a.code === '4000');
      if (!incomeAccount) {
        const { data: newIncomeAccount } = await supabase
          .from('accounts')
          .insert({
            user_id: user?.id,
            code: '4000',
            name: 'Ingresos por Alquiler',
            type: 'income',
            description: 'Ingresos generados por alquiler de propiedades'
          })
          .select()
          .single();
        incomeAccount = newIncomeAccount;
      }

      if (cashAccount && incomeAccount) {
        // Create the double-entry accounting entries
        const entries = [
          {
            user_id: user?.id,
            date: payment.payment_date,
            description: `Pago recibido - ${payment.notes || 'Alquiler'}`,
            account_id: cashAccount.id,
            debit_amount: payment.amount,
            credit_amount: null,
            reference: `PAY-${payment.id}`
          },
          {
            user_id: user?.id,
            date: payment.payment_date,
            description: `Ingreso por alquiler - ${payment.notes || 'Alquiler'}`,
            account_id: incomeAccount.id,
            debit_amount: null,
            credit_amount: payment.amount,
            reference: `PAY-${payment.id}`
          }
        ];

        const { error } = await supabase
          .from('accounting_entries')
          .insert(entries);

        if (error) {
          console.error('Error creating accounting entries:', error);
        } else {
          // Removed console.log for security
        }
      }
    } catch (error) {
      console.error('Error in automated accounting integration:', error);
    }
  };

  return null; // This is a service component with no UI
}
