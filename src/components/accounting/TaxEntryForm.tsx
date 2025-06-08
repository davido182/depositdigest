
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaxEntry, TaxType, TaxStatus } from "@/types";
import { toast } from "sonner";

interface TaxEntryFormProps {
  entry: TaxEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: TaxEntry) => void;
}

export function TaxEntryForm({ entry, isOpen, onClose, onSave }: TaxEntryFormProps) {
  const [formData, setFormData] = useState<Partial<TaxEntry>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    taxType: 'municipal_tax' as TaxType,
    baseAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    status: 'pending' as TaxStatus,
    dueDate: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        description: entry.description,
        taxType: entry.taxType,
        baseAmount: entry.baseAmount,
        taxRate: entry.taxRate,
        taxAmount: entry.taxAmount,
        status: entry.status,
        dueDate: entry.dueDate || '',
        paidDate: entry.paidDate || '',
        reference: entry.reference || '',
        notes: entry.notes || ''
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        taxType: 'municipal_tax' as TaxType,
        baseAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        status: 'pending' as TaxStatus,
        dueDate: '',
        reference: '',
        notes: ''
      });
    }
  }, [entry, isOpen]);

  const calculateTaxAmount = (base: number, rate: number) => {
    return (base * rate) / 100;
  };

  const handleBaseAmountChange = (value: string) => {
    const baseAmount = Number(value);
    const taxAmount = calculateTaxAmount(baseAmount, formData.taxRate || 0);
    setFormData(prev => ({ 
      ...prev, 
      baseAmount,
      taxAmount 
    }));
  };

  const handleTaxRateChange = (value: string) => {
    const taxRate = Number(value);
    const taxAmount = calculateTaxAmount(formData.baseAmount || 0, taxRate);
    setFormData(prev => ({ 
      ...prev, 
      taxRate,
      taxAmount 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.taxType || !formData.baseAmount) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const newEntry: TaxEntry = {
      id: entry?.id || Math.random().toString(36).substring(2, 15),
      date: formData.date!,
      description: formData.description!,
      taxType: formData.taxType!,
      baseAmount: Number(formData.baseAmount),
      taxRate: Number(formData.taxRate),
      taxAmount: Number(formData.taxAmount),
      status: formData.status!,
      dueDate: formData.dueDate || undefined,
      paidDate: formData.status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
      reference: formData.reference,
      notes: formData.notes,
      createdAt: entry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newEntry);
  };

  const taxTypeLabels = {
    municipal_tax: "Impuesto Municipal",
    fire_department_fee: "Tasa Bomberos",
    vat: "IVA",
    income_tax: "Impuesto Renta",
    withholding_tax: "Retención",
    other: "Otro"
  };

  const statusLabels = {
    pending: "Pendiente",
    paid: "Pagado",
    overdue: "Vencido",
    cancelled: "Cancelado"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {entry ? 'Editar Impuesto' : 'Nuevo Impuesto'}
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
              placeholder="Descripción del impuesto"
              required
            />
          </div>

          <div>
            <Label htmlFor="taxType">Tipo de Impuesto *</Label>
            <Select 
              value={formData.taxType} 
              onValueChange={(value: TaxType) => setFormData(prev => ({ ...prev, taxType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(taxTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseAmount">Base Imponible *</Label>
              <Input
                id="baseAmount"
                type="number"
                step="0.01"
                value={formData.baseAmount}
                onChange={(e) => handleBaseAmountChange(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="taxRate">Tasa % *</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => handleTaxRateChange(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="taxAmount">Monto Impuesto</Label>
            <Input
              id="taxAmount"
              type="number"
              step="0.01"
              value={formData.taxAmount}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: TaxStatus) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dueDate">Fecha Vencimiento</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
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
