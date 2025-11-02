import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    DollarSign,
    Home,
    Users,
    X,
    ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Inconsistency {
    id: string;
    type: 'rent_mismatch' | 'unit_assignment' | 'missing_data';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    tenantData: any;
    unitData: any;
    suggestedAction: string;
}

export function DataConsistencyChecker() {
    const { user } = useAuth();
    const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (user?.id) {
            checkDataConsistency();
        }
    }, [user?.id]);

    const checkDataConsistency = async () => {
        if (!user?.id) return;

        setIsChecking(true);
        const foundInconsistencies: Inconsistency[] = [];

        try {
            // Get tenants data
            const { tenantService } = await import('@/services/TenantService');
            const tenants = await tenantService.getTenants();

            // Get units data with property info
            const { data: units, error: unitsError } = await supabase
                .from('units')
                .select(`
          id,
          unit_number,
          monthly_rent,
          tenant_id,
          property_id,
          properties!inner(name, landlord_id)
        `)
                .eq('properties.landlord_id', user.id);

            if (unitsError) {
                console.error('Error fetching units:', unitsError);
                return;
            }

            // Check for rent mismatches
            tenants.forEach(tenant => {
                if (tenant.unit && tenant.unit !== 'Sin unidad') {
                    const unit = units?.find(u => u.unit_number === tenant.unit);

                    if (unit) {
                        const tenantRent = tenant.rentAmount || 0;
                        const unitRent = unit.monthly_rent || 0;

                        // Check for significant rent differences (more than €1)
                        if (Math.abs(tenantRent - unitRent) > 1) {
                            foundInconsistencies.push({
                                id: `rent_mismatch_${tenant.id}`,
                                type: 'rent_mismatch',
                                severity: Math.abs(tenantRent - unitRent) > 100 ? 'high' : 'medium',
                                title: 'Diferencia de Renta Detectada',
                                description: `${tenant.name} tiene diferentes montos de renta`,
                                tenantData: {
                                    name: tenant.name,
                                    unit: tenant.unit,
                                    rent: tenantRent,
                                    property: tenant.propertyName
                                },
                                unitData: {
                                    unit_number: unit.unit_number,
                                    rent: unitRent,
                                    property: unit.properties?.name
                                },
                                suggestedAction: tenantRent > unitRent ?
                                    'Actualizar renta de la unidad' :
                                    'Actualizar renta del inquilino'
                            });
                        }
                    }
                }
            });

            // Check for unit assignment issues
            tenants.forEach(tenant => {
                if (tenant.unit && tenant.unit !== 'Sin unidad') {
                    const unit = units?.find(u => u.unit_number === tenant.unit);

                    if (!unit) {
                        foundInconsistencies.push({
                            id: `missing_unit_${tenant.id}`,
                            type: 'unit_assignment',
                            severity: 'medium',
                            title: 'Unidad No Encontrada',
                            description: `${tenant.name} está asignado a una unidad que no existe`,
                            tenantData: {
                                name: tenant.name,
                                unit: tenant.unit,
                                property: tenant.propertyName
                            },
                            unitData: null,
                            suggestedAction: 'Verificar y corregir asignación de unidad'
                        });
                    } else if (unit.tenant_id && unit.tenant_id !== tenant.id) {
                        foundInconsistencies.push({
                            id: `unit_conflict_${tenant.id}`,
                            type: 'unit_assignment',
                            severity: 'high',
                            title: 'Conflicto de Asignación',
                            description: `La unidad ${tenant.unit} está asignada a múltiples inquilinos`,
                            tenantData: {
                                name: tenant.name,
                                unit: tenant.unit
                            },
                            unitData: {
                                unit_number: unit.unit_number,
                                current_tenant_id: unit.tenant_id
                            },
                            suggestedAction: 'Resolver conflicto de asignación'
                        });
                    }
                }
            });

            // Check for missing essential data
            tenants.forEach(tenant => {
                if (!tenant.rentAmount || tenant.rentAmount === 0) {
                    foundInconsistencies.push({
                        id: `missing_rent_${tenant.id}`,
                        type: 'missing_data',
                        severity: 'medium',
                        title: 'Renta No Definida',
                        description: `${tenant.name} no tiene monto de renta definido`,
                        tenantData: {
                            name: tenant.name,
                            unit: tenant.unit,
                            rent: tenant.rentAmount
                        },
                        unitData: null,
                        suggestedAction: 'Definir monto de renta'
                    });
                }
            });

            setInconsistencies(foundInconsistencies);
            setLastCheck(new Date());

            if (foundInconsistencies.length > 0) {
                toast.warning(`Se encontraron ${foundInconsistencies.length} inconsistencias en tus datos`);
            }

        } catch (error) {
            console.error('Error checking data consistency:', error);
            toast.error('Error al verificar consistencia de datos');
        } finally {
            setIsChecking(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'low': return <AlertTriangle className="h-4 w-4 text-blue-600" />;
            default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
        }
    };

    const dismissInconsistency = (id: string) => {
        setInconsistencies(prev => prev.filter(inc => inc.id !== id));
    };

    if (!isVisible || inconsistencies.length === 0) {
        return null;
    }

    return (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="h-5 w-5" />
                        Inconsistencias Detectadas
                        <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                            {inconsistencies.length}
                        </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={checkDataConsistency}
                            disabled={isChecking}
                            className="text-orange-700 border-orange-300"
                        >
                            <RefreshCw className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                            Verificar
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsVisible(false)}
                            className="text-orange-700"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {lastCheck && (
                    <p className="text-xs text-orange-600">
                        Última verificación: {lastCheck.toLocaleString('es-ES')}
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-3">
                {inconsistencies.map((inconsistency) => (
                    <Alert key={inconsistency.id} className="border-l-4 border-l-orange-400">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                                {getSeverityIcon(inconsistency.severity)}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-sm">{inconsistency.title}</h4>
                                        <Badge className={getSeverityColor(inconsistency.severity)}>
                                            {inconsistency.severity === 'high' ? 'Alta' :
                                                inconsistency.severity === 'medium' ? 'Media' : 'Baja'}
                                        </Badge>
                                    </div>

                                    <AlertDescription className="text-xs mb-2">
                                        {inconsistency.description}
                                    </AlertDescription>

                                    {inconsistency.type === 'rent_mismatch' && (
                                        <div className="flex items-center gap-4 text-xs bg-white p-2 rounded border">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3 text-blue-600" />
                                                <span className="font-medium">Inquilino:</span>
                                                <span>€{inconsistency.tenantData.rent}</span>
                                            </div>
                                            <ArrowRight className="h-3 w-3 text-gray-400" />
                                            <div className="flex items-center gap-1">
                                                <Home className="h-3 w-3 text-green-600" />
                                                <span className="font-medium">Unidad:</span>
                                                <span>€{inconsistency.unitData.rent}</span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-orange-700 mt-2 font-medium">
                                        💡 {inconsistency.suggestedAction}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissInconsistency(inconsistency.id)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </Alert>
                ))}

                <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                    💡 <strong>Tip:</strong> Estas inconsistencias pueden afectar tus reportes y cálculos.
                    Te recomendamos resolverlas para mantener datos precisos.
                </div>
            </CardContent>
        </Card>
    );
}