# INVESTIGACIÓN DE LA RAÍZ DEL PROBLEMA

## Problemas Identificados

### 1. ✅ Mismo problema en TenantPaymentTracker
- **Confirmado**: También usa lógica restrictiva para mostrar unidades
- **Arreglado**: Simplificada la lógica de visualización

### 2. ✅ Ordenamiento de unidades mejorado
- **Problema**: Unidades desordenadas en el formulario
- **Solución**: Ordenamiento alfanumérico mejorado

### 3. ⚠️ Rendimiento en móvil
- **Posible causa**: Múltiples llamadas a `refreshUserRole` con timeouts
- **Impacto**: Lentitud en carga inicial y asignación de roles

### 4. 🔍 Problema principal: Datos no se muestran
- **Síntoma**: Se guardan pero no aparecen en tabla
- **Hipótesis**: Datos llegan como strings vacíos `''` en lugar de `null`

## Logs de Debug Agregados

```javascript
// En SupabaseTenantService.ts
console.log('🔍 [SIMPLE] First tenant raw data:', tenantsData[0]);
console.log('🔍 [SIMPLE] First tenant unit_number:', tenantsData[0].unit_number);
console.log('🔍 [SIMPLE] First tenant property_name:', tenantsData[0].property_name);

// Mapeo detallado
console.log(`📋 [SIMPLE] Mapping tenant ${fullName}:`, {
  unitIsEmpty: unitNumber === '',
  propertyIsEmpty: propertyName === '',
  unitIsNull: tenant.unit_number === null,
  propertyIsNull: tenant.property_name === null
});
```

## Próximos Pasos para Debugging

1. **Revisar logs de consola** después de editar un inquilino
2. **Verificar** si `unit_number` y `property_name` son `''` o `null`
3. **Confirmar** que el updateTenant esté guardando correctamente
4. **Probar** la sincronización bidireccional

## Hipótesis Principal

El problema puede estar en que:
- Los campos se guardan como `''` (string vacío) en lugar de `null`
- La tabla muestra "Sin asignar" porque `''` se evalúa como falsy
- Pero los datos reales están ahí, solo que como strings vacíos

## Verificación Necesaria

Después de editar un inquilino, revisar en consola:
- ¿Qué valor tiene `unit_number`?
- ¿Qué valor tiene `property_name`?
- ¿Se están guardando correctamente en la BD?