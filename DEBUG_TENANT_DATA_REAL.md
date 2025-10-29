# DEBUG - DATOS REALES DE INQUILINOS

## Problema Identificado

La tabla muestra "Sin asignar" en lugar de los datos reales de propiedad y unidad.

## Análisis del Flujo

### 1. SupabaseTenantService.getTenants()
```javascript
// Líneas 40-50: Mapeo de datos
const unitNumber = tenant.unit_number || '';
const propertyName = tenant.property_name || '';

// Líneas 70-75: Aliases para formularios
unit: unitNumber,
propertyName: propertyName,
```

### 2. TenantsTable (Líneas 266-280)
```javascript
// ANTES (restrictivo):
{tenant.propertyName && 
 tenant.propertyName !== 'Sin propiedad' && 
 tenant.propertyName !== 'Edificio Principal' && 
 tenant.propertyName.trim() !== '' 
 ? tenant.propertyName 
 : "Sin asignar"}

// AHORA (simplificado):
{tenant.propertyName || "Sin asignar"}
```

## Posibles Causas

1. **Datos vacíos en BD**: `unit_number` y `property_name` están como `''` o `null`
2. **Mapeo incorrecto**: Los campos no se están guardando correctamente
3. **Sincronización fallida**: UnitEditForm no está actualizando la tabla tenants

## Verificación Necesaria

1. **Revisar logs de consola**: `📋 [SIMPLE] Mapping tenant` para ver datos raw
2. **Verificar BD**: Comprobar si `unit_number` y `property_name` tienen datos
3. **Probar sincronización**: Asignar inquilino desde UnitEditForm y verificar

## Próximos Pasos

1. Simplificar la lógica de visualización ✅
2. Verificar que los datos se estén guardando correctamente
3. Confirmar que la sincronización bidireccional funcione
4. Restaurar las fechas y otros campos que funcionaban antes