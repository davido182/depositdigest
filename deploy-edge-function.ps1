# Script para desplegar Edge Function de Supabase en Windows
# Ejecutar como: .\deploy-edge-function.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Desplegando Edge Function a Supabase" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Supabase CLI está instalado
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "Supabase CLI no está instalado." -ForegroundColor Yellow
    Write-Host "Instalando Supabase CLI usando Scoop..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar si Scoop está instalado
    $scoopInstalled = Get-Command scoop -ErrorAction SilentlyContinue
    
    if (-not $scoopInstalled) {
        Write-Host "Scoop no está instalado. Instalando Scoop primero..." -ForegroundColor Yellow
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
        Write-Host "Scoop instalado correctamente." -ForegroundColor Green
    }
    
    # Instalar Supabase CLI
    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
    scoop install supabase
    
    Write-Host "Supabase CLI instalado correctamente." -ForegroundColor Green
    Write-Host ""
}

Write-Host "Verificando instalación de Supabase CLI..." -ForegroundColor Cyan
supabase --version
Write-Host ""

# Login a Supabase
Write-Host "Iniciando sesión en Supabase..." -ForegroundColor Cyan
Write-Host "Se abrirá tu navegador para autenticarte." -ForegroundColor Yellow
Write-Host ""
supabase login

# Link al proyecto
Write-Host ""
Write-Host "Ahora necesitas vincular tu proyecto." -ForegroundColor Cyan
Write-Host "Ingresa tu Project Reference ID (lo encuentras en Supabase Dashboard > Settings > General)" -ForegroundColor Yellow
$projectRef = Read-Host "Project Reference ID"

supabase link --project-ref $projectRef

# Desplegar la función
Write-Host ""
Write-Host "Desplegando la función ai-assistant..." -ForegroundColor Cyan
supabase functions deploy ai-assistant

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "¡Despliegue completado!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora prueba el chat en tu aplicación." -ForegroundColor Cyan
