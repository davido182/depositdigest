# 🔧 SOLUCIONAR CONFIRMACIÓN DE EMAIL

## 🚨 PROBLEMA: No llegan emails de confirmación

### ✅ SOLUCIÓN 1: Confirmar manualmente en Supabase
1. **Supabase Dashboard** → **Authentication** → **Users**
2. **Busca el usuario** que se registró
3. **Clic en el usuario** → **Confirm user** (botón)
4. **El usuario ya puede hacer login**

### ✅ SOLUCIÓN 2: Desactivar confirmación por email (temporal)
1. **Authentication** → **Settings**
2. **User Signups** → **Enable email confirmations** → **OFF**
3. **Los nuevos usuarios** se confirman automáticamente

### ✅ SOLUCIÓN 3: Configurar SMTP personalizado
1. **Authentication** → **Settings** → **SMTP Settings**
2. **Enable custom SMTP** → **ON**
3. **Configurar con Gmail/SendGrid/etc.**

### 🎯 RECOMENDACIÓN INMEDIATA:
**Usar Solución 1** para usuarios existentes
**Usar Solución 2** para nuevos registros (temporal)

### 📧 VERIFICAR SPAM:
- **Carpeta de spam/junk**
- **Promotions tab** (Gmail)
- **Filtros de email** del usuario