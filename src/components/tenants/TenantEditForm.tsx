
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
      console.log('TenantEditForm: Modal opened with tenant:', tenant);
      
      // Always load properties first
      loadProperties();
      
      if (tenant) {
        // Set form data immediately
        setFormData({ ...tenant });
        setHasDeposit(tenant.depositAmount > 0);
        setSelectedPropertyId(''); // Will be determined by unit
        setErrors({});
        setContractFile(null);
        setExistingContract(null);
        
        // If tenant has a unit, try to find the property
        if (tenant.unit && tenant.unit !== 'Sin unidad') {
          findPropertyByUnit(tenant.unit);
        } else {
          loadAvailableUnits();
        }
      } else {
        console.log('TenantEditForm: New tenant form');
        setFormData({ ...emptyTenant });
        setHasDeposit(false);
        setSelectedPropertyId('');
        setErrors({});
        setContractFile(null);
        setExistingContract(null);
        loadAvailableUnits();
      }
    }
  }, [isOpen, tenant]);

  const loadProperties = async () => {
    try {
      const props = await propertyService.getProperties();
      setProperties(props);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Error al cargar propiedades");
    }
  };

  const findPropertyByUnit = async (unitNumber: string) => {
    try {
      const { data: unitData, error } = await supabase
        .from('units')
        .select('property_id, rent_amount')
        .eq('unit_number', unitNumber)
        .single();

      if (error || !unitData) {
        console.log('Unit not found, loading all units');
        loadAvailableUnits();
        return;
      }

      console.log('Found unit data:', unitData);
      setSelectedPropertyId(unitData.property_id);
      
      // Update rent amount if available
      if (unitData.rent_amount && unitData.rent_amount > 0) {
        setFormData(prev => ({ ...prev, rentAmount: unitData.rent_amount }));
      }
      
      // Load units for this property
      loadUnitsForProperty(unitData.property_id);
    } catch (error) {
      console.error('Error finding property by unit:', error);
      loadAvailableUnits();
    }
  };

  const loadTenantProperty = async (tenantId: string) => {
    // Simplified - we'll handle property assignment differently
    // For now, just skip this to avoid database errors
    return;
  };

  const loadExistingContract = async (tenantId: string) => {
    // Simplified - skip contract loading for now to avoid database errors
    return;
  };

  const loadUnitsForProperty = async (propertyId: string) => {
    try {
      setIsLoadingUnits(true);
      console.log('🔍 Loading units for property:', propertyId);
      
      // Load ALL units for specific property (not just available ones)
      const { data: unitsData, error } = await supabase
        .from('units')
        .select('unit_number, is_available, id, rent_amount')
        .eq('property_id', propertyId);

      if (error) {
        console.error('❌ Error loading units for property:', error);
        setAvailableUnits([]);
        return;
      }

      console.log('📊 Units data for property:', unitsData);

      // Extract unit numbers from database
      const availableUnitNumbers = (unitsData || []).map(unit => unit.unit_number);
      
      // If editing, always include current tenant's unit
      if (tenant && tenant.unit && tenant.unit !== 'Sin unidad' && !availableUnitNumbers.includes(tenant.unit)) {
        availableUnitNumbers.push(tenant.unit);
      }
      
      setAvailableUnits(availableUnitNumbers.sort((a, b) => {
        const aNum = parseInt(a) || 0;
        const bNum = parseInt(b) || 0;
        return aNum - bNum;
      }));
      
      console.log(`✅ Loaded ${availableUnitNumbers.length} units for property ${propertyId}:`, availableUnitNumbers);
    } catch (error) {
      console.error("❌ Error loading units for property:", error);
      setAvailableUnits([]);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const loadAvailableUnits = async () => {
    // If a property is selected, load units for that property
    if (selectedPropertyId) {
      await loadUnitsForProperty(selectedPropertyId);
    } else {
      // Load all available units if no property selected
      try {
        setIsLoadingUnits(true);
        
        const { data: unitsData, error } = await supabase
          .from('units')
          .select('unit_number, is_available, property_id, properties(name)')
          .eq('is_available', true);

        if (error) {
          console.error('Error loading units:', error);
          setAvailableUnits([]);
          return;
        }

        const availableUnitNumbers = (unitsData || []).map(unit => unit.unit_number);
        
        if (tenant && tenant.unit && !availableUnitNumbers.includes(tenant.unit)) {
          availableUnitNumbers.push(tenant.unit);
        }
        
        setAvailableUnits(availableUnitNumbers.sort((a, b) => {
          const aNum = parseInt(a) || 0;
          const bNum = parseInt(b) || 0;
          return aNum - bNum;
        }));
        
        console.log(`Loaded ${availableUnitNumbers.length} available units from all properties`);
      } catch (error) {
        console.error("Error loading available units:", error);
        setAvailableUnits([]);
      } finally {
        setIsLoadingUnits(false);
      }
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

    // Handle "none" value as empty string
    const unitValue = value === "none" ? "" : value;

    setFormData({
      ...formData,
      unit: unitValue,
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

    if (!validateForm()) {
      return;
    }

    try {
      console.log("🔄 Submitting tenant data:", formData);
      
      const updatedTenant = {
        ...formData,
        updatedAt: new Date().toISOString(),
        id: formData.id || `tenant-${Date.now()}`,
        propertyId: selectedPropertyId, // Include selected property
      };

      console.log("📤 Final tenant data to save:", updatedTenant);
      
      // Call onSave and wait for it to complete
      await onSave(updatedTenant);
      
      console.log("✅ Tenant saved successfully");

      if (contractFile && updatedTenant.id) {
        await handleContractUpload(contractFile);
      }
      
      // Close the form after successful save
      onClose();
      toast.success(tenant ? "Inquilino actualizado correctamente" : "Inquilino creado correctamente");
    } catch (error) {
      console.error("❌ Error submitting tenant:", error);
      toast.error("Error al guardar inquilino. Inténtalo de nuevo.");
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
              <Label htmlFor="property">
                Propiedad
              </Label>
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                <Select
                  value={selectedPropertyId || "none"}
                  onValueChange={(value) => {
                    const propertyId = value === "none" ? "" : value;
                    setSelectedPropertyId(propertyId);
                    // Reset unit selection when property changes
                    setFormData(prev => ({ ...prev, unit: "" }));
                    // Reload units for the new property
                    if (propertyId) {
                      loadUnitsForProperty(propertyId);
                    } else {
                      setAvailableUnits([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {properties.length > 0 ? (
                      properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name} - {property.address}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">
                  Unidad (Opcional)
                </Label>
                <div className="flex items-center">
                  <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Select
                    value={formData.unit || "none"}
                    onValueChange={async (value) => {
                      const unitValue = value === "none" ? "" : value;
                      setFormData(prev => ({ ...prev, unit: unitValue }));
                      
                      // Load rent amount for selected unit
                      if (unitValue && selectedPropertyId) {
                        try {
                          console.log('🔍 Loading rent for unit:', unitValue, 'in property:', selectedPropertyId);
                          const { data: unitData, error } = await supabase
                            .from('units')
                            .select('rent_amount, id')
                            .eq('unit_number', unitValue)
                            .eq('property_id', selectedPropertyId)
                            .single();
                          
                          if (error) {
                            console.error('❌ Error loading unit rent:', error);
                          } else if (unitData) {
                            console.log('💰 Found unit rent:', unitData.rent_amount);
                            setFormData(prev => ({ 
                              ...prev, 
                              unit: unitValue,
                              rentAmount: unitData.rent_amount || prev.rentAmount
                            }));
                          }
                        } catch (error) {
                          console.error('❌ Error loading unit rent:', error);
                        }
                      }
                    }}
                    disabled={isLoadingUnits}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingUnits ? "Cargando..." : "Seleccionar unidad (opcional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
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
                <p className="text-xs text-muted-foreground">
                  {selectedPropertyId ? "Unidades de la propiedad seleccionada" : "Selecciona una propiedad primero"}
                </p>
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
