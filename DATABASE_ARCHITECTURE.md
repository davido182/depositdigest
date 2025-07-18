# Arquitectura de Base de Datos - RentFlow

## Visión General

La base de datos de RentFlow está construida sobre PostgreSQL en Supabase, implementando un diseño relacional optimizado para gestión inmobiliaria con Row Level Security (RLS) para máxima seguridad.

## Principios de Diseño

### 1. Seguridad First
- **Row Level Security (RLS)** habilitado en todas las tablas
- Políticas específicas por rol de usuario
- Separación clara entre datos de propietarios e inquilinos
- Edge functions con permisos elevados para operaciones administrativas

### 2. Escalabilidad
- Uso de UUIDs como claves primarias para distribución futura
- Índices optimizados para consultas frecuentes
- Normalización balanceada entre performance y flexibilidad

### 3. Auditabilidad
- Timestamps automáticos (created_at, updated_at)
- Triggers para actualización automática de timestamps
- Preservación de historial de cambios importantes

## Esquema Detallado

### Tipos de Datos Personalizados (ENUMs)

```sql
-- Roles de usuario en el sistema
CREATE TYPE user_role AS ENUM (
    'landlord_free',      -- Propietario plan gratuito (max 5 propiedades)
    'landlord_premium',   -- Propietario plan premium (ilimitado)
    'tenant'              -- Inquilino
);

-- Planes de suscripción
CREATE TYPE app_plan AS ENUM (
    'free',               -- Plan gratuito
    'premium'             -- Plan premium
);
```

### Tablas Core del Sistema

#### 1. Tabla `profiles`
**Propósito**: Información extendida de usuarios (complementa auth.users)

```sql
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);
```

**Relaciones**: 
- 1:1 con `auth.users`
- Actualizada automáticamente via trigger en signup

#### 2. Tabla `user_roles`
**Propósito**: Gestión de roles y permisos del sistema

```sql
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'landlord_free',
    landlord_id UUID,                    -- Para inquilinos: referencia al propietario
    property_limit INTEGER DEFAULT 5,    -- Límite de propiedades (NULL = ilimitado)
    unit_code TEXT,                      -- Para inquilinos: código de unidad
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, role)               -- Un usuario, un rol activo
);

-- RLS Policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Landlords can view their tenants" ON user_roles
    FOR SELECT USING (landlord_id = auth.uid());

CREATE POLICY "Edge functions can manage roles" ON user_roles
    FOR ALL USING (true);               -- Para operaciones administrativas
```

**Índices**:
```sql
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_landlord_id ON user_roles(landlord_id);
```

#### 3. Tabla `tenants`
**Propósito**: Información detallada de inquilinos y contratos

```sql
CREATE TABLE public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    landlord_id UUID,                    -- Referencia al propietario
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    unit_number TEXT NOT NULL,
    rent_amount NUMERIC NOT NULL CHECK (rent_amount > 0),
    lease_start_date DATE NOT NULL,
    lease_end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users can create their own tenants" ON tenants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tenants" ON tenants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tenants" ON tenants
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Landlords can view their tenants" ON tenants
    FOR SELECT USING (landlord_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Tenants can view their own info" ON tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'tenant' 
            AND landlord_id = tenants.landlord_id
        )
    );
```

**Validaciones**:
- rent_amount debe ser positivo
- status limitado a valores válidos
- lease_start_date no puede ser en el futuro distante

#### 4. Tabla `payments`
**Propósito**: Registro de pagos de alquiler y otros conceptos

```sql
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    landlord_id UUID,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash' 
        CHECK (payment_method IN ('cash', 'transfer', 'card', 'stripe')),
    status TEXT NOT NULL DEFAULT 'completed' 
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies similares a tenants
-- Índices para performance
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_user_id ON payments(user_id);
```

#### 5. Tabla `maintenance_requests`
**Propósito**: Gestión de solicitudes de mantenimiento

```sql
CREATE TABLE public.maintenance_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    landlord_id UUID,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    unit_number TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para filtrado común
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_created_at ON maintenance_requests(created_at DESC);
```

#### 6. Tabla `accounts` (Contabilidad)
**Propósito**: Plan de cuentas contables

```sql
CREATE TABLE public.accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,                  -- Código contable (ej: 1100, 4000)
    name TEXT NOT NULL,                  -- Nombre de la cuenta
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, code)               -- Código único por usuario
);

-- Índice para jerarquía
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);
CREATE INDEX idx_accounts_type ON accounts(type);
```

#### 7. Tabla `accounting_entries`
**Propósito**: Asientos contables (debe/haber)

```sql
CREATE TABLE public.accounting_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    debit_amount NUMERIC CHECK (debit_amount >= 0),
    credit_amount NUMERIC CHECK (credit_amount >= 0),
    reference TEXT,                      -- Referencia externa (ej: factura)
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CHECK (
        (debit_amount IS NOT NULL AND credit_amount IS NULL) OR
        (debit_amount IS NULL AND credit_amount IS NOT NULL)
    )                                   -- Solo uno de los dos puede tener valor
);

-- Índices para reportes contables
CREATE INDEX idx_accounting_entries_date ON accounting_entries(date DESC);
CREATE INDEX idx_accounting_entries_account ON accounting_entries(account_id);
```

#### 8. Tabla `subscribers`
**Propósito**: Gestión de suscripciones y planes

```sql
CREATE TABLE public.subscribers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    subscribed BOOLEAN NOT NULL DEFAULT false,
    plan app_plan NOT NULL DEFAULT 'free',
    subscription_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policy para suscripciones
CREATE POLICY "Users can view their own subscription" ON subscribers
    FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can manage subscriptions" ON subscribers
    FOR ALL USING (true);
```

#### 9. Tablas Adicionales

##### `tax_entries`
**Propósito**: Gestión de obligaciones fiscales

```sql
CREATE TABLE public.tax_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    tax_type TEXT NOT NULL,              -- IVA, IRPF, etc.
    base_amount NUMERIC NOT NULL,
    tax_rate NUMERIC NOT NULL,
    tax_amount NUMERIC NOT NULL,
    due_date DATE,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'overdue')),
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

##### `tenant_invitations`
**Propósito**: Sistema de invitaciones para inquilinos

```sql
CREATE TABLE public.tenant_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    unit_number TEXT NOT NULL,
    invitation_code TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

##### `lease_contracts`
**Propósito**: Almacenamiento de contratos digitales

```sql
CREATE TABLE public.lease_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,             -- Ruta en Supabase Storage
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Funciones de Base de Datos

### 1. Función `get_user_role`
```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT role FROM public.user_roles 
    WHERE user_id = _user_id 
    LIMIT 1;
$$;
```

### 2. Función `has_premium`
```sql
CREATE OR REPLACE FUNCTION public.has_premium(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.subscribers 
        WHERE user_id = _user_id 
        AND subscribed = true 
        AND plan = 'premium'
    );
$$;
```

### 3. Función `generate_invitation_code`
```sql
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE sql
AS $$
    SELECT upper(substring(encode(gen_random_bytes(6), 'base64'), 1, 8));
$$;
```

### 4. Trigger Function `handle_new_user`
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        )
    );
    RETURN NEW;
END;
$$;

-- Trigger asociado
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();
```

## Estrategias de Optimización

### Índices Críticos
```sql
-- Performance para dashboard
CREATE INDEX idx_tenants_landlord_status ON tenants(landlord_id, status);
CREATE INDEX idx_payments_user_date ON payments(user_id, payment_date DESC);

-- Búsquedas de texto
CREATE INDEX idx_tenants_name_gin ON tenants USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_maintenance_text_gin ON maintenance_requests 
    USING gin(to_tsvector('spanish', title || ' ' || description));

-- Filtros frecuentes
CREATE INDEX idx_maintenance_user_status ON maintenance_requests(user_id, status);
CREATE INDEX idx_accounting_user_date ON accounting_entries(user_id, date DESC);
```

### Particionado (Futuro)
Para escalabilidad futura, considerar particionado por:
- `payments` por año
- `accounting_entries` por trimestre
- `maintenance_requests` por año

## Backup y Recuperación

### Estrategia de Backup
1. **Backup automático diario** (Supabase nativo)
2. **Point-in-time recovery** hasta 7 días
3. **Exports programados** de datos críticos

### Disaster Recovery
1. **RTO**: 4 horas máximo
2. **RPO**: 1 hora máximo
3. **Réplicas geográficas** para usuarios premium

## Monitoreo y Alertas

### Métricas Clave
- Tiempo de respuesta de queries críticos
- Uso de almacenamiento
- Número de conexiones activas
- Errores de RLS

### Alertas Configuradas
- Queries lentos (>2 segundos)
- Alto uso de CPU/memoria
- Fallos de backup
- Violaciones de RLS

## Evolución del Esquema

### Versionado
- Migraciones numeradas secuencialmente
- Scripts de rollback para cada migración
- Testing automático en ambiente staging

### Cambios Pendientes
1. **Soft deletes** para auditabilía
2. **Tabla de logs** para acciones críticas
3. **Índices adicionales** basados en patrones de uso

---

Esta arquitectura proporciona una base sólida, segura y escalable para RentFlow, balanceando performance, seguridad y flexibilidad para crecimiento futuro.