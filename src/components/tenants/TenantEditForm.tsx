
import React from "react";
import { useState, useEffect } from "react";
import { Tenant } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, DollarSign, Home, Mail, Phone, Upload, FileText, Building } from "lucide-react";
import { toast } from "sonner";
import DatabaseService from "@/services/DatabaseService";
import { ValidationService } from "@/services/ValidationService";
import { validatePhone, sanitizeInput } from "@/utils/validation";
import { supabase } from "@/integrations/supabase/client";
import { propertyService } from "@/services/PropertyService";

interface TenantEditFormProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
}

export function TenantEditForm({
  tenant,
  isOpen,
  onClose,
  onSave,
}: TenantEditFormProps) {
  const emptyTenant: Tenant = {
    id: "",
    name: "",
    email: "",
    phone: "",
    unit: "",
    moveInDate: new Date().toISOString().split("T")[0],
    leaseEndDate: "",
    rentAmount: 0,
    depositAmount: 0,
    status: "active",
    paymentHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<Tenant>(tenant || emptyTenant);
  const [hasDeposit, setHasDeposit] = useState(
    tenant ? tenant.depositAmount > 0 : false
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [totalUnits, setTotalUnits] = useState(20);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [isUploadingContract, setIsUploadingContract] = useState(false);
  const [existingContract, setExistingContract] = useState<string | null>(null);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setFormData(tenant || emptyTenant);
      setHasDeposit(tenant ? tenant.depositAmount > 0 : false);
      setErrors({});
      setContractFile(null);
      setExistingContract(null);
      loadProperties();
      loadAvailableUnits();
      if (tenant) {
        loadExistingContract(tenant.id);
        // Set selected property if editing
        if (tenant.id) {
          loadTenantProperty(tenant.id);
        }
      }
    }
  }, [tenant, isOpen]);

  const loadProperties = async () => {
    try {
      const props = await propertyService.getProperties();
      setProperties(props);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Error al cargar propiedades");
    }
  };

  const loadTenantProperty = async (tenantId: string) => {
    try {
      const { data: tenantData, error } = await supabase
        .from('tenants')
        .select('property_id')
        .eq('id', tenantId)
        .single();

      if (error) {
        console.error('Error loading tenant property:', error);
        return;
      }

      if (tenantData?.property_id) {
        setSelectedPropertyId(tenantData.property_id);
      }
    } catch (error) {
      console.error('Error loading tenant property:', error);
    }
  };

  const loadExistingContract = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('lease_contracts')
        .select('file_name')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        console.error('Error loading existing contract:', error);
        return;
      }

      if (data) {
        setExistingContract(data.file_name);
      }
    } catch (error) {
      console.error('Error loading existing contract:', error);
    }
  };

  const loadAvailableUnits = async () => {
    try {
      setIsLoadingUnits(true);
      const dbService = DatabaseService.getInstance();
      const tenants = await dbService.getTenants();
      setAllTenants(tenants);
      const units = dbService.getTotalUnits();
      setTotalUnits(units);
      
      const allUnits = Array.from({ length: units }, (_, i) => (i + 1).toString());
      
      // For editing, include current tenant's unit in available units
      const occupiedUnits = tenants
        .filter(t => t.status === 'active' && (tenant ? t.id !== tenant.id : true))
        .map(t => t.unit);
        
      const available = allUnits.filter(unit => !occupiedUnits.includes(unit));
      
      // Always include current tenant's unit when editing
      if (tenant && tenant.unit && !available.includes(tenant.unit)) {
        available.push(tenant.unit);
      }
      
      setAvailableUnits(available.sort((a, b) => parseInt(a) - parseInt(b)));
      console.log(`Loaded ${available.length} available units out of ${units} total units`);
    } catch (error) {
      console.error("Error loading available units:", error);
      const fallbackUnits = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
      setAvailableUnits(fallbackUnits);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const handleContractUpload = async (file: File) => {
    if (!formData.id) {
      toast.error("Please save the tenant first before uploading a contract");
      return;
    }

    try {
      setIsUploadingContract(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${formData.id}/contract_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lease-contracts')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Error uploading contract");
        return;
      }

      const { error: dbError } = await supabase
        .from('lease_contracts')
        .insert({
          user_id: user.id,
          tenant_id: formData.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: fileName
        });

      if (dbError) {
        console.error('Database error:', dbError);
        await supabase.storage
          .from('lease-contracts')
          .remove([fileName]);
        toast.error("Error saving contract information");
        return;
      }

      setExistingContract(file.name);
      toast.success("Contract uploaded successfully");
    } catch (error) {
      console.error('Error uploading contract:', error);
      toast.error("Error uploading contract");
    } finally {
      setIsUploadingContract(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Clear any existing error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === "rentAmount" || name === "depositAmount") {
      const numValue = parseFloat(value) || 0;
      setFormData({
        ...formData,
        [name]: numValue,
      });
    } else if (name === "name" || name === "email") {
      // Sanitize text inputs
      setFormData({
        ...formData,
        [name]: sanitizeInput(value),
      });
    } else if (name === "phone") {
      // Format phone number
      const formatted = validatePhone(value);
      setFormData({
        ...formData,
        [name]: formatted,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData({
      ...formData,
      status: value as Tenant["status"],
    });
  };
  
  const handleUnitChange = (value: string) => {
    // Clear unit error when changing
    if (errors.unit) {
      setErrors(prev => ({ ...prev, unit: '' }));
    }
    
    setFormData({
      ...formData,
      unit: value,
    });
  };

  const handleDepositToggle = (checked: boolean) => {
    setHasDeposit(checked);
    if (!checked) {
      setFormData({
        ...formData,
        depositAmount: 0,
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      const validationService = ValidationService.getInstance();
      
      if (tenant) {
        // Editing existing tenant
        validationService.validateTenantUpdate(formData, allTenants);
      } else {
        // Creating new tenant
        validationService.validateTenant(formData, allTenants);
      }
      
      return true;
    } catch (error: any) {
      if (error.message.includes('name')) newErrors.name = error.message;
      else if (error.message.includes('email')) newErrors.email = error.message;
      else if (error.message.includes('rent')) newErrors.rentAmount = error.message;
      else if (error.message.includes('deposit')) newErrors.depositAmount = error.message;
      else if (error.message.includes('unit') || error.message.includes('occupied')) newErrors.unit = error.message;
      else if (error.message.includes('date')) newErrors.moveInDate = error.message;
      else {
        toast.error(error.message);
      }
      
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const updatedTenant = {
          ...formData,
          updatedAt: new Date().toISOString(),
          id: formData.id || `tenant-${Date.now()}`,
        };
        
        console.log("Submitting tenant data:", updatedTenant);
        onSave(updatedTenant);

        if (contractFile && updatedTenant.id) {
          await handleContractUpload(contractFile);
        }
      } catch (error) {
        console.error("Error submitting tenant:", error);
        toast.error("Error saving tenant. Please try again.");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tenant ? "Editar Inquilino" : "Agregar Nuevo Inquilino"}
          </DialogTitle>
          <DialogDescription>
            {tenant
              ? "Actualiza la información del inquilino."
              : "Ingresa los detalles del nuevo inquilino."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-destructive" : ""}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="property" className="flex items-center gap-1">
                Propiedad <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                <Select 
                  value={selectedPropertyId} 
                  onValueChange={setSelectedPropertyId}
                >
                  <SelectTrigger className={errors.property ? "border-destructive" : ""}>
                    <SelectValue placeholder="Seleccionar propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length > 0 ? (
                      properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-properties" disabled>
                        No hay propiedades disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {errors.property && (
                <p className="text-xs text-destructive">{errors.property}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit" className="flex items-center gap-1">
                  Unidad <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center">
                  <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Select 
                    value={formData.unit} 
                    onValueChange={handleUnitChange}
                    disabled={isLoadingUnits || !selectedPropertyId}
                  >
                    <SelectTrigger className={errors.unit ? "border-destructive" : ""}>
                      <SelectValue placeholder={
                        !selectedPropertyId ? "Primero selecciona una propiedad" :
                        isLoadingUnits ? "Cargando..." : "Seleccionar unidad"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingUnits ? (
                        <SelectItem value="loading" disabled>
                          Cargando unidades...
                        </SelectItem>
                      ) : availableUnits.length > 0 ? (
                        availableUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>
                            Unidad {unit}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-units" disabled>
                          No hay unidades disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {errors.unit && (
                  <p className="text-xs text-destructive">{errors.unit}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="late">Atrasado</SelectItem>
                    <SelectItem value="notice">En Aviso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="moveInDate">Fecha de Ingreso</Label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="moveInDate"
                    name="moveInDate"
                    type="date"
                    value={formData.moveInDate}
                    onChange={handleChange}
                    className={errors.moveInDate ? "border-destructive" : ""}
                  />
                </div>
                {errors.moveInDate && (
                  <p className="text-xs text-destructive">{errors.moveInDate}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="leaseEndDate">Fecha Fin de Contrato (Opcional)</Label>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="leaseEndDate"
                    name="leaseEndDate"
                    type="date"
                    value={formData.leaseEndDate || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rentAmount" className="flex items-center gap-1">
                Monto de Renta <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                <Input
                  id="rentAmount"
                  name="rentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.rentAmount === 0 ? "" : formData.rentAmount.toString()}
                  onChange={handleChange}
                  placeholder="Ingrese el monto de renta"
                  className={errors.rentAmount ? "border-destructive" : ""}
                />
              </div>
              {errors.rentAmount && (
                <p className="text-xs text-destructive">{errors.rentAmount}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hasDeposit"
                checked={hasDeposit}
                onCheckedChange={handleDepositToggle}
              />
              <Label htmlFor="hasDeposit">Tiene Depósito de Seguridad</Label>
            </div>

            {hasDeposit && (
              <div className="grid gap-2 ml-6">
                <Label
                  htmlFor="depositAmount"
                  className="flex items-center gap-1"
                >
                  Monto del Depósito <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    id="depositAmount"
                    name="depositAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.depositAmount}
                    onChange={handleChange}
                    className={errors.depositAmount ? "border-destructive" : ""}
                  />
                </div>
                {errors.depositAmount && (
                  <p className="text-xs text-destructive">
                    {errors.depositAmount}
                  </p>
                )}
              </div>
            )}

            {/* Contract Upload Section */}
            <div className="grid gap-2">
              <Label>Contrato de Arrendamiento (Opcional)</Label>
              {existingContract && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{existingContract}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {tenant && contractFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => contractFile && handleContractUpload(contractFile)}
                    disabled={isUploadingContract}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {isUploadingContract ? "Subiendo..." : "Subir"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos soportados: PDF, JPG, PNG (Máx 10MB)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: sanitizeInput(e.target.value) })
                }
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              ></textarea>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoadingUnits}>
              {tenant ? "Guardar Cambios" : "Crear Inquilino"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
