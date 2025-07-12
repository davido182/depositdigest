
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Calculator, 
  MessageCircle, 
  Smartphone, 
  Crown, 
  Check,
  ArrowRight,
  UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = {
    free: [
      "Gestión básica de inquilinos",
      "Registro de pagos",
      "Solicitudes de mantenimiento",
      "Invitaciones a inquilinos",
      "Reportes básicos",
      "Hasta 5 unidades"
    ],
    premium: [
      "Todo lo de la versión gratuita",
      "Contabilidad completa",
      "Asistente IA especializado",
      "Análisis avanzados",
      "Unidades ilimitadas",
      "Portal del cliente Stripe",
      "Soporte prioritario"
    ],
    tenant: [
      "Ver información de la unidad",
      "Realizar pagos",
      "Solicitar mantenimiento",
      "Comunicación con propietario"
    ]
  };

  const handleDemoClick = () => {
    window.open("https://depositdigest.lovable.app/", "_blank");
  };

  const handleMobileDownload = (platform: 'ios' | 'android') => {
    if (platform === 'ios') {
      // Redirect to App Store when available
      window.open("https://apps.apple.com/search?term=rentflow", "_blank");
    } else {
      // Redirect to Google Play when available
      window.open("https://play.google.com/store/search?q=rentflow", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">RentFlow</h1>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate("/login")}>
              Comenzar Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Disponible en App Store y Google Play
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gestiona tus propiedades de
            <span className="text-blue-600"> forma inteligente</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            RentFlow es la plataforma completa para propietarios e inquilinos. 
            Gestiona pagos, mantenimiento, contabilidad y más desde tu móvil o web.
          </p>
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/login")} className="bg-blue-600 hover:bg-blue-700">
                Comenzar Gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleDemoClick}>
                Ver Demo
              </Button>
            </div>
            
            {/* Dashboard Preview Box */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 w-80 shadow-lg">
              <div className="text-sm font-semibold text-gray-600 mb-4">Vista previa del Dashboard</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-xs text-blue-600">Ingresos Mensuales</div>
                    <div className="text-lg font-bold text-blue-800 animate-pulse">€12,450</div>
                  </div>
                  <div className="w-8 h-8 bg-blue-200 rounded-full animate-bounce"></div>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="text-xs text-green-600">Ocupación</div>
                    <div className="text-lg font-bold text-green-800 animate-pulse">92%</div>
                  </div>
                  <div className="w-8 h-8 bg-green-200 rounded-full animate-spin"></div>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div>
                    <div className="text-xs text-purple-600">Propiedades</div>
                    <div className="text-lg font-bold text-purple-800 animate-pulse">15</div>
                  </div>
                  <div className="w-8 h-8 bg-purple-200 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Todo lo que necesitas en una sola app
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Desde gestión básica hasta análisis avanzados con IA
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Gestión de Inquilinos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Organiza la información de todos tus inquilinos en un solo lugar</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CreditCard className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Pagos Automáticos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Recibe pagos directamente desde la app con Stripe</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calculator className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Contabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Contabilidad completa y reportes fiscales automáticos</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Asistente IA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Asistente inteligente para consultas y análisis</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Planes para cada necesidad
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Desde propietarios individuales hasta grandes portfolios
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Plan Gratuito
                  <Badge variant="secondary">Gratis</Badge>
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-gray-600">/mes</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.free.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant="outline" onClick={() => navigate("/login")}>
                  Comenzar Gratis
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-blue-500 border-2">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Más Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Plan Premium
                  <Crown className="h-5 w-5 text-yellow-500" />
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">€3.99</span>
                  <span className="text-gray-600">/mes</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.premium.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/login")}>
                  Comenzar Prueba
                </Button>
              </CardContent>
            </Card>

            {/* Tenant Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  App para Inquilinos
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">Gratis</span>
                  <span className="text-gray-600"> para inquilinos</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.tenant.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant="outline" onClick={() => navigate("/tenant-signup")}>
                  Acceso con Código
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile Apps Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            También disponible como app móvil
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Gestiona tus propiedades desde cualquier lugar con nuestras apps nativas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Card 
              className="p-6 min-w-[200px] cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleMobileDownload('ios')}
            >
              <div className="flex items-center gap-4">
                <div className="bg-black rounded-lg p-2">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Descargar en</p>
                  <p className="text-lg font-bold">App Store</p>
                </div>
              </div>
            </Card>
            <Card 
              className="p-6 min-w-[200px] cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleMobileDownload('android')}
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-600 rounded-lg p-2">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Obtener en</p>
                  <p className="text-lg font-bold">Google Play</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold">RentFlow</h3>
              </div>
              <p className="text-gray-400">
                La plataforma completa para la gestión de propiedades en alquiler.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Características</li>
                <li>Precios</li>
                <li className="cursor-pointer hover:text-white" onClick={handleDemoClick}>Demo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Centro de Ayuda</li>
                <li>Contacto</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Privacidad</li>
                <li>Términos</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RentFlow. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
