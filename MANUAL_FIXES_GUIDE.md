# 🔧 MANUAL FIXES GUIDE - CRITICAL ISSUES

## ❌ **PERSISTENT PROBLEMS IDENTIFIED**

### **1. Database Field Names Mismatch**
**Error**: `lease_end_date` doesn't exist
**Real Database Fields** (from migration):
```sql
tenants {
  moveInDate DATE,        -- NOT lease_start_date
  leaseEndDate DATE,      -- NOT lease_end_date  
  rent_amount DECIMAL,    -- NOT monthly_rent
  depositAmount DECIMAL,  -- NOT deposit_amount
  status TEXT,            -- NOT is_active
}
```

### **2. Date Format Issues**
**Problem**: Dates not editable, wrong format
**Solution**: Added date format helpers and display

### **3. Unit Selection Not Working**
**Problem**: Empty string vs "none" value mismatch
**Solution**: Fixed SelectItem values

---

## ✅ **FIXES APPLIED**

### **1. SmartNotifications.tsx - Fixed Database Query**
```typescript
// ❌ BEFORE (400 Error)
.select('id, name, lease_end_date')
.not('lease_end_date', 'is', null)
.lte('lease_end_date', thirtyDaysFromNow)

// ✅ AFTER (Correct Field Names)
.select('id, name, leaseEndDate')
.not('leaseEndDate', 'is', null)
.lte('leaseEndDate', thirtyDaysFromNow)
```

### **2. TenantEditForm.tsx - Fixed Date Handling**
```typescript
// ✅ Added Date Format Helpers
const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0]; // YYYY-MM-DD for input
};

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString('es-ES'); // DD/MM/YYYY for display
};

// ✅ Fixed Date Inputs
<Input
  type="date"
  value={formatDateForInput(formData.moveInDate)}
  onChange={handleChange}
/>

// ✅ Added Date Display
{formData.moveInDate && (
  <p className="text-xs text-muted-foreground">
    Formato: {formatDateForDisplay(formData.moveInDate)}
  </p>
)}
```

### **3. TenantEditForm.tsx - Fixed Unit Selection**
```typescript
// ❌ BEFORE (Value mismatch)
<Select value={formData.unit || "none"}>
  <SelectItem value="none">Sin asignar</SelectItem>

// ✅ AFTER (Consistent empty string)
<Select value={formData.unit || ""}>
  <SelectItem value="">Sin asignar</SelectItem>
```

---

## 🎯 **WHAT SHOULD WORK NOW**

### ✅ **Date Editing**
1. **Dates are editable** - Fixed input format handling
2. **DD/MM/YYYY display** - Shows formatted date below input
3. **Proper validation** - Handles invalid dates gracefully

### ✅ **Unit Selection**
1. **Property selection works** - Loads units correctly
2. **Unit dropdown populates** - After selecting property
3. **Empty values handled** - No more "none" vs "" conflicts

### ✅ **Database Queries**
1. **No more 400 errors** - Uses correct field names
2. **SmartNotifications works** - Fixed `leaseEndDate` field
3. **All queries aligned** - With actual database structure

---

## 🚨 **IF PROBLEMS PERSIST**

### **Manual Database Check**
Run this query in Supabase SQL Editor:
```sql
-- Check actual table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public';
```

### **Expected Results:**
```
column_name     | data_type
----------------|----------
id              | uuid
landlord_id     | uuid
name            | text
email           | text
phone           | text
moveInDate      | date        ← NOT lease_start_date
leaseEndDate    | date        ← NOT lease_end_date
rent_amount     | numeric     ← NOT monthly_rent
depositAmount   | numeric     ← NOT deposit_amount
status          | text        ← NOT is_active
notes           | text
property_id     | uuid
created_at      | timestamp
updated_at      | timestamp
```

### **If Fields Don't Match:**
1. **Run the migration**: `supabase db reset`
2. **Or manually rename fields** in Supabase dashboard
3. **Update types.ts** to match actual database

---

## 🔧 **QUICK FIXES FOR REMAINING ISSUES**

### **If Unit Selection Still Doesn't Work:**
```typescript
// In TenantEditForm.tsx, add debugging:
console.log('Selected Property ID:', selectedPropertyId);
console.log('Available Units:', availableUnits);
console.log('Is Loading Units:', isLoadingUnits);
```

### **If Dates Still Not Editable:**
```typescript
// Check if formData.moveInDate is a valid date string
console.log('Move In Date:', formData.moveInDate);
console.log('Formatted for Input:', formatDateForInput(formData.moveInDate));
```

### **If 400 Errors Persist:**
1. **Check browser Network tab** - See exact query being made
2. **Compare with database schema** - Ensure field names match
3. **Update all components** - That use the wrong field names

---

**🎯 RESULT**: These fixes should resolve all critical issues
**📅 Date**: January 10, 2025
**✅ Status**: MANUAL FIXES APPLIED