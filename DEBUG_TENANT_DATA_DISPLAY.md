# Debug: Problema de Visualización de Datos de Inquilinos

## Problema Identificado
- ✅ El formulario de inquilinos SÍ carga la propiedad correctamente
- ❌ Las unidades NO se ven en el formulario de inquilinos
- ❌ En la tabla de inquilinos NO se ven nombres de propiedades ni unidades
- ❌ En seguimiento de pagos NO se ven nombres de propiedades ni unidades

## Correcciones Aplicadas

### 1. Logo Actualizado
- ✅ Creado nuevo logo SVG en `/public/rentaflux-logo.svg`
- ✅ Actualizado en Sidebar.tsx

### 2. Logging Agregado
- ✅ SupabaseTenantService: Logging detallado del mapeo de datos
- ✅ TenantsTable: Logging de datos recibidos
- ✅ TenantPaymentTracker: Logging de datos recibidos

## Pasos de Debugging

### 1. Verificar Consola del Navegador
Busca estos logs para identificar el problema:

```
🔍 [DEFINITIVE] Fetching tenants from Supabase...
✅ [DEFINITIVE] Fetched units with tenants: X
📋 [MAPPING] Tenant [Nombre]: {
  unit: "...",
  property: "...",
  propertyId: "...",
  assignedUnit: {...},
  propertiesFromUnit: {...},
  tenantPropertyName: "..."
}
🔍 [TABLE] TenantsTable received tenants: X
🔍 [TABLE] First tenant data: {
  unit: "...",
  propertyName: "...",
  property_name: "...",
  unit_number: "..."
}
🔍 [PAYMENTS] TenantPaymentTracker received tenants: X
```

### 2. Verificar Base de Datos
Ejecuta en Supabase SQL Editor:

```sql
-- Ver estructura actual de inquilinos
SELECT 
    t.id,
    t.name,
    t.property_id,
    t.property_name,
    u.unit_number,
    u.tenant_id,
    p.name as property_name_from_properties
FROM tenants t
LEFT JOIN units u ON u.tenant_id = t.id
LEFT JOIN properties p ON p.id = t.property_id
ORDER BY t.name;

-- Ver unidades con inquilinos
SELECT 
    u.id,
    u.unit_number,
    u.tenant_id,
    u.property_id,
    u.is_available,
    p.name as property_name,
    t.name as tenant_name
FROM units u
LEFT JOIN properties p ON p.id = u.property_id
LEFT JOIN tenants t ON t.id = u.tenant_id
ORDER BY p.name, u.unit_number;
```

### 3. Verificar Datos en Componentes
Abre las herramientas de desarrollador y verifica:

1. **En TenantsTable**: ¿Los objetos `tenant` tienen `propertyName` y `unit`?
2. **En TenantPaymentTracker**: ¿Los objetos `tenant` tienen `propertyName` y `unit`?
3. **En SupabaseTenantService**: ¿La consulta de unidades devuelve datos de propiedades?

## Posibles Causas del Problema

### Causa 1: Consulta de Unidades Fallando
**Síntoma**: Los logs muestran `assignedUnit: null` o `propertiesFromUnit: null`
**Solución**: Verificar que la consulta de unidades esté funcionando correctamente

### Causa 2: Mapeo de Campos Incorrecto
**Síntoma**: Los logs muestran datos pero `propertyName` o `unit` están vacíos
**Solución**: Verificar el mapeo en SupabaseTenantService

### Causa 3: Datos No Refrescándose
**Síntoma**: Los datos están en la base de datos pero no se muestran en la UI
**Solución**: Verificar que los componentes se estén re-renderizando con datos actualizados

### Causa 4: Estructura de Base de Datos Inconsistente
**Síntoma**: Algunos inquilinos muestran datos, otros no
**Solución**: Verificar que todos los inquilinos tengan asignaciones correctas en la tabla `units`

## Acciones Inmediatas

### 1. Ejecutar Prueba Completa
1. Abre la consola del navegador
2. Ve a la sección de Inquilinos
3. Verifica los logs de `[TABLE]`
4. Ve a la sección de Pagos
5. Verifica los logs de `[PAYMENTS]`

### 2. Verificar Datos Específicos
Si los logs muestran que `propertyName` o `unit` están vacíos:
1. Ejecuta las consultas SQL arriba
2. Verifica que los inquilinos tengan `tenant_id` en la tabla `units`
3. Verifica que las unidades tengan `property_id` válido

### 3. Forzar Actualización de Datos
1. Ve a Propiedades → Asigna un inquilino a una unidad
2. Ve a Inquilinos → Verifica si se muestra la asignación
3. Si no se muestra, el problema está en la sincronización

## Próximos Pasos Según Resultados

### Si los logs muestran datos correctos pero no se ven en la UI:
- Problema de renderizado en los componentes
- Verificar que los campos correctos se estén usando en JSX

### Si los logs muestran datos vacíos:
- Problema en SupabaseTenantService
- Verificar la consulta de unidades y el mapeo

### Si algunos inquilinos muestran datos y otros no:
- Problema de consistencia en base de datos
- Ejecutar script de sincronización de datos

## Estado Actual
- ✅ Logo actualizado
- ✅ Logging agregado para debugging
- ⏳ Pendiente: Identificar causa raíz del problema de visualización
- ⏳ Pendiente: Aplicar corrección específica según resultados del debugging