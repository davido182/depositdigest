# Arreglo del Campo depositAmount

## Problema Identificado
Error: `Could not find the 'depositAmount' column of 'tenants' in the schema cache`

## Causa
La tabla `tenants` en la base de datos no tiene la columna `depositAmount` o tiene un nombre diferente.

## Solución Aplicada

### 1. Temporalmente Deshabilitado el Campo
- Removido `depositAmount` del insert en `createTenant`
- Comentado el mapeo en `updateTenant`
- Esto permite que las operaciones básicas funcionen

### 2. Agregado Debugging Mejorado
- El método `testConnection` ahora muestra la estructura real de la tabla
- Logs detallados para identificar campos disponibles

## Código Modificado

### SupabaseTenantService.ts
```typescript
// ANTES (causaba error):
depositAmount: Number(tenant.depositAmount || 0),

// DESPUÉS (temporalmente removido):
// depositAmount removido del insert

// ANTES (causaba error):
if (updates.depositAmount !== undefined) updateData.depositAmount = Number(updates.depositAmount);

// DESPUÉS (temporalmente deshabilitado):
// Temporarily disabled: if (updates.depositAmount !== undefined) updateData.depositAmount = Number(updates.depositAmount);
```

## Próximos Pasos

1. **Probar Crear/Editar Inquilino** - Debería funcionar sin el campo depositAmount
2. **Verificar Estructura Real** - Los logs mostrarán qué campos existen realmente
3. **Agregar Campo Correcto** - Una vez identificado el nombre real del campo

## Campos Confirmados que Funcionan
- `name`
- `email` 
- `phone`
- `moveInDate`
- `leaseEndDate`
- `rent_amount`
- `status`
- `notes`
- `property_id`
- `landlord_id`

## Verificación de Estructura
El método `testConnection()` ahora mostrará:
```
📋 Sample tenant structure: ['id', 'name', 'email', ...]
```

Esto nos dirá exactamente qué campos están disponibles en la tabla.