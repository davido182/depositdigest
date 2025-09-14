#!/bin/bash

# Script para configurar entorno de desarrollo de RentaFlux
# Uso: ./scripts/setup-env.sh

set -e

echo "🔧 Setting up RentaFlux development environment..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    echo "❌ Node.js version 18 or later is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Instalar dependencias
echo "📦 Installing dependencies..."
npm install

# Verificar si existe .env.local
if [[ ! -f ".env.local" ]]; then
    echo "📝 Creating .env.local from template..."
    if [[ -f ".env.example" ]]; then
        cp .env.example .env.local
        echo "✅ .env.local created from .env.example"
        echo "⚠️ IMPORTANTE: Edita .env.local con tus credenciales reales"
        echo "   Las credenciales las obtienes de:"
        echo "   - Supabase: https://supabase.com/dashboard"
        echo "   - Stripe: https://dashboard.stripe.com/test/apikeys"
    else
        echo "❌ .env.example not found"
    fi
else
    echo "✅ .env.local already exists"
fi

# Verificar Capacitor CLI
if ! command -v cap &> /dev/null; then
    echo "📱 Installing Capacitor CLI..."
    npm install -g @capacitor/cli
fi

echo "✅ Capacitor CLI $(cap --version) detected"

# Configurar Git hooks (opcional)
if [[ -d ".git" ]]; then
    echo "🔗 Setting up Git hooks..."
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."

# Ejecutar linting
npm run lint
if [[ $? -ne 0 ]]; then
    echo "❌ Linting failed. Please fix the issues before committing."
    exit 1
fi

# Ejecutar type checking
npm run type-check
if [[ $? -ne 0 ]]; then
    echo "❌ Type checking failed. Please fix the issues before committing."
    exit 1
fi

echo "✅ Pre-commit checks passed"
EOF

    chmod +x .git/hooks/pre-commit
    echo "✅ Git hooks configured"
fi

# Verificar configuración de Supabase
echo "🔍 Checking Supabase configuration..."
if [[ -f ".env.local" ]]; then
    if grep -q "VITE_SUPABASE_URL=" .env.local && grep -q "VITE_SUPABASE_ANON_KEY=" .env.local; then
        echo "✅ Supabase configuration found"
    else
        echo "⚠️ Supabase configuration incomplete in .env.local"
    fi
else
    echo "⚠️ .env.local file not found"
fi

# Crear directorios necesarios
mkdir -p logs
mkdir -p backups
mkdir -p temp

# Ejecutar verificación de seguridad
echo "🔒 Running security check..."
if [[ -f "scripts/security-check.sh" ]]; then
    chmod +x scripts/security-check.sh
    ./scripts/security-check.sh
else
    echo "⚠️ Security check script not found"
fi

echo ""
echo "🎉 Development environment setup completed!"
echo ""
echo "🔒 PASOS DE SEGURIDAD IMPORTANTES:"
echo "1. ✅ .env.local está configurado y NO se sube a GitHub"
echo "2. 📝 Edita .env.local con tus credenciales reales (ver docs/security-guide.md)"
echo "3. 🔍 Ejecuta 'npm run security-check' antes de cada commit"
echo ""
echo "Next steps:"
echo "1. Configure your .env.local file with Supabase credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Run 'npm run build:mobile' to prepare for mobile development"
echo ""
echo "Available commands:"
echo "  npm run dev              - Start development server"
echo "  npm run dev:staging      - Start with staging configuration"
echo "  npm run build            - Build for production"
echo "  npm run build:staging    - Build for staging"
echo "  npm run lint             - Run linting"
echo "  npm run type-check       - Run TypeScript checking"
echo ""
echo "Mobile commands:"
echo "  npm run cap:add:android  - Add Android platform"
echo "  npm run cap:add:ios      - Add iOS platform (Mac only)"
echo "  npm run cap:sync         - Sync web assets to mobile"
echo ""