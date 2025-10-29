# DEBUG - SINCRONIZACIÓN SIMPLE DE INQUILINOS

## Problema Identificado
Según el log:
- ✅ Los datos se guardan correctamente en la base de datos
- ❌ Pero al refrescar la tabla, aparecen vacíos: `unit: "", propertyName: ""`

## Cambios Realizados

### 1. Simplificado getTenants()
- Eliminada lógica compleja de mapeo con units
- Usa SOLO los datos directos de la tabla `tenants`
- Campos utilizados: `unit_number`, `property_id`, `property_name`

### 2. Simplificado updateTenant()
- Eliminada doble actualización
- Todo se actualiza en una sola operación
- Incluye `unit_number` en el update principal

### 3. Logs de Depuración
- `🔍 [SIMPLE]` para getTenants
- `📋 [SIMPLE]` para mapeo de datos
- Muestra datos raw del primer inquilino

## Flujo Esperado

```
1. Usuario edita inquilino → Envía { unit: "2", propertyId: "uuid" }
2. updateTenant() → Guarda { unit_number: "2", property_id: "uuid", property_name: "Mi casa" }
3. getTenants() → Lee directamente { unit_number: "2", property_name: "Mi casa" }
4. Tabla muestra → Unidad: "2", Propiedad: "Mi casa"
```

## Verificación

Después de esta actualización, los logs deberían mostrar:
- `🔍 [SIMPLE] First tenant raw data:` con los campos reales de la BD
- `📋 [SIMPLE] Mapping tenant` con los valores correctos
- Tabla actualizada con datos sincronizados

## Próximos Pasos

Si aún no funciona:
1. Revisar el log `First tenant raw data` para ver qué campos existen realmente
2. Verificar que `unit_number` y `property_name` se estén guardando
3. Ajustar el mapeo según los campos reales de la BD