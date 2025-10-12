# Guía de Debugging - Problemas con Inquilinos

## Problema Actual
- Los datos de inquilinos no se guardan en la base de datos
- Los mensajes de éxito aparecen pero los datos no se reflejan en la tabla
- Tanto crear como editar inquilinos fallan silenciosamente

## Pasos de Debugging

### 1. Verificar Logs en Consola del Navegador
Buscar estos mensajes en la consola:

```
🔍 Testing database connection for user: [user-id]
✅ Database connection test successful. Found tenants: [number]
💾 Starting save operation for tenant: [tenant-data]
📋 Insert data prepared: [insert-data]
📤 Mapped update data for database: [update-data]
```

### 2. Verificar Errores de Base de Datos
Buscar errores como:
- `PGRST204` - Columna no encontrada
- `PGRST116` - Violación de política RLS
- `PGRST301` - Violación de restricción

### 3. Verificar Autenticación
```javascript
// En consola del navegador:
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### 4. Verificar Estructura de Tabla
```sql
-- En Supabase SQL Editor:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tenants';
```

### 5. Verificar Políticas RLS
```sql
-- En Supabase SQL Editor:
SELECT * FROM pg_policies WHERE tablename = 'tenants';
```

## Campos Esperados en Base de Datos

### Tabla `tenants`
- `id` (UUID, PK)
- `landlord_id` (UUID, FK to auth.users)
- `name` (TEXT, NOT NULL)
- `email` (TEXT)
- `phone` (TEXT)
- `moveInDate` (DATE)
- `leaseEndDate` (DATE)
- `rent_amount` (DECIMAL)
- `depositAmount` (DECIMAL)
- `status` (TEXT)
- `notes` (TEXT)
- `property_id` (UUID, FK to properties)

## Mapeo de Campos Frontend → Backend

| Frontend | Backend |
|----------|---------|
| `name` | `name` |
| `email` | `email` |
| `phone` | `phone` |
| `moveInDate` | `moveInDate` |
| `leaseEndDate` | `leaseEndDate` |
| `rentAmount` | `rent_amount` |
| `depositAmount` | `depositAmount` |
| `status` | `status` |
| `notes` | `notes` |
| `propertyId` | `property_id` |

## Comandos de Prueba

### Probar Inserción Manual
```javascript
// En consola del navegador:
const { data, error } = await supabase
  .from('tenants')
  .insert({
    landlord_id: 'user-id-here',
    name: 'Test Tenant',
    email: 'test@example.com',
    moveInDate: '2024-01-01',
    rent_amount: 1000,
    status: 'active'
  });
console.log('Insert result:', { data, error });
```

### Probar Consulta
```javascript
// En consola del navegador:
const { data, error } = await supabase
  .from('tenants')
  .select('*')
  .eq('landlord_id', 'user-id-here');
console.log('Query result:', { data, error });
```

## Posibles Causas

1. **Campos Faltantes**: Campos requeridos no están siendo enviados
2. **Tipos de Datos**: Conversión incorrecta de tipos (string vs number)
3. **Políticas RLS**: Usuario no tiene permisos para insertar/actualizar
4. **Restricciones FK**: property_id no existe o es inválido
5. **Validaciones**: Datos no pasan validaciones de base de datos

## Próximos Pasos

1. Revisar logs completos en consola
2. Verificar que el usuario esté autenticado
3. Probar inserción manual en Supabase
4. Verificar políticas RLS
5. Revisar estructura de tabla actual