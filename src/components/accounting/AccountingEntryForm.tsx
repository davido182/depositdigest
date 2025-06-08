
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountingEntry, Account } from "@/types";
import { toast } from "sonner";

interface AccountingEntryFormProps {
  entry: AccountingEntry | null;
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: AccountingEntry) => void;
}

export function AccountingEntryForm({ 
  entry, 
  accounts, 
  isOpen, 
  onClose, 
  onSave 
}: AccountingEntryFormProps) {
  const [formData, setFormData] = useState<Partial<AccountingEntry>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    accountId: '',
    debitAmount: undefined,
    creditAmount: undefined,
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        description: entry.description,
        accountId: entry.accountId,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        reference: entry.reference || '',
        notes: entry.notes || ''
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        accountId: '',
        debitAmount: undefined,
        creditAmount: undefined,
        reference: '',
        notes: ''
      });
    }
  }, [entry, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.accountId) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    if (!formData.debitAmount && !formData.creditAmount) {
      toast.error("Debe ingresar un monto en débito o crédito");
      return;
    }

    if (formData.debitAmount && formData.creditAmount) {
      toast.error("No puede tener monto en débito y crédito al mismo tiempo");
      return;
    }

    const newEntry: AccountingEntry = {
      id: entry?.id || Math.random().toString(36).substring(2, 15),
      date: formData.date!,
      description: formData.description!,
      accountId: formData.accountId!,
      debitAmount: formData.debitAmount ? Number(formData.debitAmount) : undefined,
      creditAmount: formData.creditAmount ? Number(formData.creditAmount) : undefined,
      reference: formData.reference,
      notes: formData.notes,
      createdAt: entry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newEntry);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {entry ? 'Editar Asiento Contable' : 'Nuevo Asiento Contable'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del asiento"
              required
            />
          </div>

          <div>
            <Label htmlFor="account">Cuenta *</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="debit">Débito</Label>
              <Input
                id="debit"
                type="number"
                step="0.01"
                value={formData.debitAmount || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  debitAmount: e.target.value ? Number(e.target.value) : undefined,
                  creditAmount: e.target.value ? undefined : prev.creditAmount
                }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="credit">Crédito</Label>
              <Input
                id="credit"
                type="number"
                step="0.01"
                value={formData.creditAmount || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  creditAmount: e.target.value ? Number(e.target.value) : undefined,
                  debitAmount: e.target.value ? undefined : prev.debitAmount
                }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reference">Referencia</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Número de referencia"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas adicionales"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {entry ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
