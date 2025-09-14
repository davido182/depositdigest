# Script de verificación de seguridad para RentaFlux (Windows PowerShell)
# Verifica que no haya credenciales expuestas

Write-Host "🔒 Ejecutando verificación de seguridad..." -ForegroundColor Cyan

$errors = 0
$warnings = 0

function Write-Error-Custom($message) {
    Write-Host "❌ ERROR: $message" -ForegroundColor Red
    $script:errors++
}

function Write-Warning-Custom($message) {
    Write-Host "⚠️  WARNING: $message" -ForegroundColor Yellow
    $script:warnings++
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

Write-Host "Verificando configuración de seguridad..." -ForegroundColor White

# 1. Verificar que .env.local no esté en Git
try {
    $gitFiles = git ls-files --error-unmatch .env.local 2>$null
    if ($gitFiles) {
        Write-Error-Custom ".env.local está siendo rastreado por Git. Ejecuta: git rm --cached .env.local"
    } else {
        Write-Success ".env.local no está en Git"
    }
} catch {
    Write-Success ".env.local no está en Git"
}

# 2. Verificar que .env.production no esté en Git
try {
    $gitFiles = git ls-files --error-unmatch .env.production 2>$null
    if ($gitFiles) {
        Write-Error-Custom ".env.production está siendo rastreado por Git. Ejecuta: git rm --cached .env.production"
    } else {
        Write-Success ".env.production no está en Git"
    }
} catch {
    Write-Success ".env.production no está en Git"
}

# 3. Verificar .gitignore
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env\.local") {
        Write-Success ".env.local está en .gitignore"
    } else {
        Write-Error-Custom ".env.local no está en .gitignore"
    }
} else {
    Write-Error-Custom ".gitignore no existe"
}

# 4. Buscar posibles credenciales hardcodeadas en el código
Write-Host "Buscando credenciales hardcodeadas..." -ForegroundColor White

# Buscar patrones de claves de Supabase en archivos .ts y .tsx
$supabasePattern = "eyJ[A-Za-z0-9]"
$foundSupabase = $false

Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match $supabasePattern) {
        Write-Warning-Custom "Posible clave de Supabase hardcodeada encontrada en $($_.Name)"
        $foundSupabase = $true
    }
}

if (-not $foundSupabase) {
    Write-Success "No se encontraron claves de Supabase hardcodeadas"
}

# Buscar patrones de claves de Stripe
$stripePattern = "pk_live_|sk_live_|pk_test_|sk_test_"
$foundStripe = $false

Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match $stripePattern) {
        Write-Warning-Custom "Posible clave de Stripe encontrada en $($_.Name) - verifica que sea solo en comentarios"
        $foundStripe = $true
    }
}

if (-not $foundStripe) {
    Write-Success "No se encontraron claves de Stripe hardcodeadas"
}

# 5. Verificar que existe .env.example
if (Test-Path ".env.example") {
    Write-Success ".env.example existe como referencia"
} else {
    Write-Warning-Custom ".env.example no existe - créalo como referencia para otros desarrolladores"
}

# 6. Verificar que .env.local existe
if (Test-Path ".env.local") {
    Write-Success ".env.local existe para desarrollo"
    
    # Verificar que no tenga valores de ejemplo
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "tu_clave_aqui|your_key_here|example|pon_tu_clave") {
        Write-Warning-Custom ".env.local contiene valores de ejemplo - actualiza con tus credenciales reales"
    }
} else {
    Write-Error-Custom ".env.local no existe - cópialo desde .env.example"
}

# 7. Verificar archivos de claves móviles
$keyFiles = Get-ChildItem -Recurse -Include "*.keystore", "*.p12" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }
if ($keyFiles) {
    Write-Warning-Custom "Archivos de claves móviles encontrados - asegúrate de que estén en .gitignore"
}

# 8. Verificar configuración de Capacitor
if (Test-Path "capacitor.config.ts") {
    $capacitorContent = Get-Content "capacitor.config.ts" -Raw
    if ($capacitorContent -match "https://.*\.supabase\.co") {
        Write-Warning-Custom "URL de Supabase hardcodeada en capacitor.config.ts - considera usar variables de entorno"
    }
}

Write-Host ""
Write-Host "📊 Resumen de verificación:" -ForegroundColor White
Write-Host "Errores: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host "Advertencias: $warnings" -ForegroundColor $(if ($warnings -eq 0) { "Green" } else { "Yellow" })

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 ¡Configuración de seguridad perfecta!" -ForegroundColor Green
    exit 0
} elseif ($errors -eq 0) {
    Write-Host "⚠️  Configuración aceptable con algunas advertencias" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Se encontraron errores de seguridad que deben corregirse" -ForegroundColor Red
    exit 1
}