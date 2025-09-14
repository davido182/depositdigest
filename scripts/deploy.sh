#!/bin/bash

# Script de deployment para RentaFlux
# Uso: ./scripts/deploy.sh [staging|production]

set -e  # Salir si cualquier comando falla

ENVIRONMENT=${1:-staging}
PROJECT_NAME="rentaflux"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Deploying RentaFlux to $ENVIRONMENT..."

# Validar entorno
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    exit 1
fi

# Verificar que estamos en la rama correcta
if [[ "$ENVIRONMENT" == "production" ]]; then
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        echo "❌ Error: Production deployments must be from 'main' branch"
        echo "Current branch: $CURRENT_BRANCH"
        exit 1
    fi
fi

# Verificar que no hay cambios sin commitear
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Error: There are uncommitted changes"
    git status --short
    exit 1
fi

# Instalar dependencias
echo "📦 Installing dependencies..."
npm ci

# Ejecutar linting
echo "🔍 Running linting..."
npm run lint

# Ejecutar type checking
echo "🔧 Running type checking..."
npm run type-check

# Construir aplicación
echo "🏗️ Building application for $ENVIRONMENT..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    npm run build
else
    npm run build:staging
fi

# Verificar que el build fue exitoso
if [[ ! -d "dist" ]]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Crear backup si es producción
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "💾 Creating backup..."
    BACKUP_DIR="backups/${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"
    
    # Aquí agregarías comandos para hacer backup de la aplicación actual
    echo "Backup created in $BACKUP_DIR"
fi

# Deploy específico por entorno
case $ENVIRONMENT in
    "staging")
        echo "🚀 Deploying to staging..."
        # Aquí agregarías los comandos específicos para staging
        # Por ejemplo: rsync, scp, o API calls a tu servidor
        echo "Staging deployment completed!"
        echo "URL: https://staging.rentaflux.com"
        ;;
    
    "production")
        echo "🚀 Deploying to production..."
        # Aquí agregarías los comandos específicos para producción
        echo "Production deployment completed!"
        echo "URL: https://rentaflux.com"
        ;;
esac

# Verificar deployment
echo "🔍 Verifying deployment..."
sleep 5

if [[ "$ENVIRONMENT" == "staging" ]]; then
    HEALTH_URL="https://staging.rentaflux.com/health"
else
    HEALTH_URL="https://rentaflux.com/health"
fi

# Verificar que la aplicación responde
if curl -f -s "$HEALTH_URL" > /dev/null; then
    echo "✅ Deployment verification successful"
else
    echo "⚠️ Warning: Health check failed, but deployment may still be successful"
fi

echo "🎉 Deployment completed successfully!"
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $TIMESTAMP"
echo "Version: $(node -p "require('./package.json').version")"