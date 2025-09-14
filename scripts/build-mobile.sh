#!/bin/bash

# Script de build para aplicaciones móviles de RentaFlux
# Uso: ./scripts/build-mobile.sh [android|ios|both] [staging|production]

set -e

PLATFORM=${1:-both}
ENVIRONMENT=${2:-production}

echo "🚀 Building RentaFlux mobile app..."
echo "Platform: $PLATFORM"
echo "Environment: $ENVIRONMENT"

# Validar parámetros
if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" && "$PLATFORM" != "both" ]]; then
    echo "❌ Error: Platform must be 'android', 'ios', or 'both'"
    exit 1
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    exit 1
fi

# Verificar que Node.js y npm están disponibles
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

# Verificar que Capacitor CLI está disponible
if ! command -v cap &> /dev/null; then
    echo "📱 Installing Capacitor CLI..."
    npm install -g @capacitor/cli
fi

echo "📦 Installing dependencies..."
npm ci

echo "🔍 Running linting..."
npm run lint

echo "🔧 Running type checking..."
npm run type-check

# Build según el entorno
echo "🏗️ Building web application for $ENVIRONMENT..."
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

echo "✅ Web build completed successfully"

# Sincronizar con Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

# Agregar plataformas si no existen
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    if [[ ! -d "android" ]]; then
        echo "📱 Adding Android platform..."
        npx cap add android
    fi
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    if [[ ! -d "ios" ]]; then
        echo "🍎 Adding iOS platform..."
        npx cap add ios
    fi
fi

# Copiar assets específicos de móvil
echo "📋 Copying mobile assets..."
if [[ -d "mobile-assets" ]]; then
    # Copiar iconos de Android
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]] && [[ -d "android" ]]; then
        echo "📱 Copying Android assets..."
        # Aquí se copiarían los iconos y splash screens específicos
    fi
    
    # Copiar iconos de iOS
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]] && [[ -d "ios" ]]; then
        echo "🍎 Copying iOS assets..."
        # Aquí se copiarían los iconos y splash screens específicos
    fi
fi

echo ""
echo "🎉 Mobile build completed successfully!"
echo ""
echo "📱 Next steps:"

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    echo "For Android:"
    echo "  1. Open Android Studio: npx cap open android"
    echo "  2. Build APK/AAB for distribution"
    echo "  3. Test on device or emulator"
fi

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    echo "For iOS:"
    echo "  1. Open Xcode: npx cap open ios (Mac only)"
    echo "  2. Configure signing certificates"
    echo "  3. Build for device or simulator"
fi

echo ""
echo "🔧 Useful commands:"
echo "  npx cap run android    # Run on Android device"
echo "  npx cap run ios        # Run on iOS device (Mac only)"
echo "  npx cap sync           # Sync changes"