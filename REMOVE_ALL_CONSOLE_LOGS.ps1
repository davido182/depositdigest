# Script para eliminar TODOS los console.log de archivos TypeScript/React

$files = @(
    "src/services/SupabaseTenantService.ts",
    "src/components/tenants/TenantEditForm.tsx",
    "src/components/tenants/TenantsTable.tsx",
    "src/components/payments/TenantPaymentTracker.tsx",
    "src/pages/Tenants.tsx",
    "src/components/units/UnitEditForm.tsx",
    "src/components/ProtectedRoute.tsx",
    "src/components/Layout.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Cleaning $file..."
        $content = Get-Content $file -Raw
        
        # Eliminar console.log completos (incluyendo multilínea)
        $content = $content -replace "console\.log\([^;]*\);?", "// Removed console.log for security"
        
        # Eliminar console.error, console.warn también si contienen info sensible
        $content = $content -replace "console\.(error|warn)\([^;]*tenant[^;]*\);?", "// Removed console for security"
        $content = $content -replace "console\.(error|warn)\([^;]*user[^;]*\);?", "// Removed console for security"
        $content = $content -replace "console\.(error|warn)\([^;]*landlord[^;]*\);?", "// Removed console for security"
        
        Set-Content $file $content
        Write-Host "Cleaned $file"
    }
}

Write-Host "All console.log statements removed!"