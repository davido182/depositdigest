#!/bin/bash

# Script de verificación de seguridad para RentaFlux
# Verifica que no haya credenciales expuestas

echo "🔒 Ejecutando verificación de seguridad..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Función para mostrar errores
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Función para mostrar advertencias
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "Verificando configuración de seguridad..."

# 1. Verificar que .env.local no esté en Git
if git ls-files --error-unmatch .env.local 2>/dev/null; then
    error ".env.local está siendo rastreado por Git. Ejecuta: git rm --cached .env.local"
else
    success ".env.local no está en Git"
fi

# 2. Verificar que .env.production no esté en Git
if git ls-files --error-unmatch .env.production 2>/dev/null; then
    error ".env.production está siendo rastreado por Git. Ejecuta: git rm --cached .env.production"
else
    success ".env.production no está en Git"
fi

# 3. Verificar .gitignore
if grep -q "\.env\.local" .gitignore; then
    success ".env.local está en .gitignore"
else
    error ".env.local no está en .gitignore"
fi

# 4. Buscar posibles credenciales hardcodeadas en el código
echo "Buscando credenciales hardcodeadas..."

# Buscar patrones de claves de Supabase
if grep -r "eyJ[A-Za-z0-9]" src/ --exclude-dir=node_modules 2>/dev/null; then
    error "Posible clave de Supabase hardcodeada encontrada en src/"
else
    success "No se encontraron claves de Supabase hardcodeadas"
fi

# Buscar patrones de claves de Stripe
if grep -r "pk_live_\|sk_live_\|pk_test_\|sk_test_" src/ --exclude-dir=node_modules 2>/dev/null; then
    warning "Posible clave de Stripe encontrada en src/ - verifica que sea solo en comentarios"
else
    success "No se encontraron claves de Stripe hardcodeadas"
fi

# Buscar passwords o secrets
if grep -ri "password.*=.*['\"][^'\"]*['\"]" src/ --exclude-dir=node_modules 2>/dev/null; then
    warning "Posible password hardcodeado encontrado"
fi

# 5. Verificar que existe .env.example
if [[ -f ".env.example" ]]; then
    success ".env.example existe como referencia"
else
    warning ".env.example no existe - créalo como referencia para otros desarrolladores"
fi

# 6. Verificar que .env.local existe
if [[ -f ".env.local" ]]; then
    success ".env.local existe para desarrollo"
    
    # Verificar que no tenga valores de ejemplo
    if grep -q "tu_clave_aqui\|your_key_here\|example" .env.local; then
        warning ".env.local contiene valores de ejemplo - actualiza con tus credenciales reales"
    fi
else
    error ".env.local no existe - cópialo desde .env.example"
fi

# 7. Verificar archivos de claves móviles
if find . -name "*.keystore" -o -name "*.p12" | grep -v node_modules; then
    warning "Archivos de claves móviles encontrados - asegúrate de que estén en .gitignore"
fi

# 8. Verificar configuración de Capacitor
if [[ -f "capacitor.config.ts" ]]; then
    if grep -q "https://.*\.supabase\.co" capacitor.config.ts; then
        warning "URL de Supabase hardcodeada en capacitor.config.ts - considera usar variables de entorno"
    fi
fi

echo ""
echo "📊 Resumen de verificación:"
echo "Errores: $ERRORS"
echo "Advertencias: $WARNINGS"

if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
    echo -e "${GREEN}🎉 ¡Configuración de seguridad perfecta!${NC}"
    exit 0
elif [[ $ERRORS -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  Configuración aceptable con algunas advertencias${NC}"
    exit 0
else
    echo -e "${RED}❌ Se encontraron errores de seguridad que deben corregirse${NC}"
    exit 1
fi