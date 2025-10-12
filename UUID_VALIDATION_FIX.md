# Arreglo de Validación UUID

## Problema Identificado
Error: `invalid input syntax for type uuid: ""`

**Causa:** El formulario está enviando strings vacíos (`""`) a campos UUID en la base de datos.

## Solución Aplicada

### 1. Validación de UUIDs en updateTenant
```typescript
// ANTES (causaba error):
updateData.property_id = updates.propertyId;

// DESPUÉS (con validación):
const propertyId = updates.propertyId && updates.propertyId.trim() !== '' ? updates.propertyId : null;
updateData.property_id = propertyId;
```

### 2. Validación de UUIDs en createTenant
```typescript
// ANTES (causaba error):
property_id: (tenant as any).propertyId,

// DESPUÉS (con validación):
property_id: (tenant as any).propertyId && (tenant as any).propertyId.trim() !== '' ? (tenant as any).propertyId : null,
```

### 3. Campos Agregados al Update
Ahora el updateTenant mapea TODOS los campos:
- ✅ `moveindate` + `move_in_date`
- ✅ `leaseenddate` + `move_out_date`  
- ✅ `rent_amount` + `monthly_rent`
- ✅ `depositamount` + `deposit_paid`
- ✅ `status` + `is_active`
- ✅ `property_id` + `property_name` (con validación UUID)

## Resultado Esperado
- ✅ No más errores de UUID inválido
- ✅ Fechas se guardan correctamente
- ✅ Rentas y depósitos se actualizan
- ✅ Estados se sincronizan
- ✅ Propiedades se asignan correctamente

## Próximo Paso
Probar editar un inquilino para confirmar que:
1. No hay errores de UUID
2. Todos los campos se guardan
3. Los datos se refrescan en la tabla