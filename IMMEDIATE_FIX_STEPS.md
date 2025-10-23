# SOLUCIÓN INMEDIATA - Datos Corruptos

## 🚨 **PROBLEMA IDENTIFICADO**
Los inquilinos tienen valores hardcodeados "Edificio Principal" y "Sin unidad" que no se actualizan cuando se guarda el formulario.

## ✅ **CORRECCIÓN APLICADA**
1. **SupabaseTenantService.updateTenant()** ahora obtiene el nombre real de la propiedad desde la base de datos
2. **Logging mejorado** para ver exactamente qué se está guardando
3. **Script de limpieza** para eliminar datos corruptos

## 🔧 **PASOS INMEDIATOS**

### **Paso 1: Ejecutar Script de Limpieza**
1. Ve a Supabase Dashboard → SQL Editor
2. Abre el archivo `EMERGENCY_DATA_CLEANUP.sql`
3. Ejecuta los queries en orden (ya tienes tu user_id: `18eaaefa-169b-4d7d-978f-7dcde085def3`)

### **Paso 2: Verificar en la Aplicación**
1. Recarga la aplicación (Ctrl + F5)
2. Ve a **Inquilinos**
3. Los inquilinos deberían mostrar "Sin asignar" en lugar de "Edificio Principal"

### **Paso 3: Reasignar Correctamente**
1. **Edita un inquilino** → Selecciona **Propiedad** → Selecciona **Unidad** → **Guardar**
2. Verifica en la consola que aparezca: `🏠 [UPDATE] Setting property_name from DB: [nombre real]`
3. Verifica que la tabla se actualice con los datos correctos

## 🔍 **Logs a Buscar en Consola**
```
📤 Mapped update data for database: {
  property_id: "uuid-real",
  property_name: "nombre-real-de-propiedad"
}
🏠 [UPDATE] Setting property_name from DB: Mi Casa Real
🔄 [UPDATE] Calling syncTenantUnitAssignment with: {
  finalPropertyName: "Mi Casa Real"
}
✅ Updated tenant in database: {...}
```

## 🎯 **RESULTADO ESPERADO**
- ❌ "Edificio Principal" → ✅ Nombre real de la propiedad
- ❌ "Sin unidad" → ✅ Número real de la unidad o "Sin asignar"
- ✅ Los cambios se guardan permanentemente
- ✅ La tabla se actualiza inmediatamente

## ⚠️ **SI AÚN NO FUNCIONA**
1. Verifica que el script SQL se ejecutó correctamente
2. Verifica que los logs muestren el property_name correcto
3. Verifica que no haya errores en la consola del navegador

**¡Esto debería resolver completamente el problema de datos corruptos!**