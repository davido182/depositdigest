# SCRIPT NUCLEAR DE LIMPIEZA - ELIMINA TODO EL CACHÉ

Write-Host "🔥 INICIANDO LIMPIEZA NUCLEAR..." -ForegroundColor Red

# 1. Eliminar carpetas de build y caché
$foldersToDelete = @(
    "dist",
    "build", 
    ".vite",
    "node_modules/.vite",
    "node_modules/.cache",
    ".next",
    ".nuxt",
    "android/app/build"
)

foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "🗑️ Eliminando $folder..." -ForegroundColor Yellow
        Remove-Item $folder -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 2. Limpiar caché de npm/yarn
Write-Host "🧹 Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null

# 3. Eliminar archivos temporales
$tempFiles = @(
    "*.log",
    "*.tmp",
    ".DS_Store",
    "Thumbs.db"
)

foreach ($pattern in $tempFiles) {
    Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}

# 4. Reinstalar dependencias
Write-Host "📦 Reinstalando dependencias..." -ForegroundColor Green
npm install

# 5. Hacer build limpio
Write-Host "🔨 Haciendo build limpio..." -ForegroundColor Green
npm run build

Write-Host "✅ LIMPIEZA NUCLEAR COMPLETADA" -ForegroundColor Green
Write-Host "🔒 Todos los archivos de caché eliminados" -ForegroundColor Green
Write-Host "🚀 Build limpio generado" -ForegroundColor Green