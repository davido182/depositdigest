
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  BarChart3,
  MessageCircle,
  Smartphone,
  Users,
  Wrench,
  ClipboardList
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();

  const handleDemoClick = () => {
    window.open("https://depositdigest.lovable.app/", "_blank");
  };

  const handleMobileDownload = (platform: 'ios' | 'android') => {
    if (platform === 'ios') {
      window.open("https://apps.apple.com/search?term=rentaflux", "_blank");
    } else {
      window.open("https://play.google.com/apps/test/com.rentaflux.app/1", "_blank");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = (data.get('name') as string) || '';
    const email = (data.get('email') as string) || '';
    const subjectRaw = (data.get('subject') as string) || 'Consulta desde RentaFlux';
    const message = (data.get('message') as string) || '';

    try {
      toast({
        title: "Enviando mensaje...",
        description: "Por favor espera un momento.",
      });

      const response = await fetch('https://formspree.io/f/mzzjvrre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: subjectRaw,
          message,
          _replyto: email,
          _subject: `${subjectRaw} - ${name}`,
        })
      });

      if (response.ok) {
        toast({
          title: "¡Mensaje enviado!",
          description: "Gracias por contactarnos. Te responderemos a la brevedad.",
        });
        form.reset();
      } else {
        throw new Error('Error en el servicio de email');
      }
    } catch {
      const subject = encodeURIComponent(`${subjectRaw} - ${name}`);
      const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}\n\n---\nEnviado desde www.rentaflux.com`);
      window.open(`mailto:rentaflux@gmail.com?subject=${subject}&body=${body}`, '_blank');
      toast({
        title: "Abriendo cliente de correo",
        description: "Se abrirá tu cliente de correo para enviar el mensaje.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">RentaFlux</h1>
          <Button variant="ghost" onClick={() => {
            localStorage.setItem('rentaflux_has_visited', 'true');
            navigate("/login");
          }}>
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/landing-hero.webp"
            alt="Panorámica urbana de edificios residenciales"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
        </div>
        <div className="container mx-auto px-4">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Disponible en App Store y Google Play
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gestiona tus propiedades de
            <span className="text-blue-600"> forma inteligente</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            RentaFlux es la plataforma completa para propietarios e inquilinos.
            Gestiona pagos, mantenimiento, reportes y más desde tu móvil o web.
          </p>
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => {
                localStorage.setItem('rentaflux_has_visited', 'true');
                navigate("/login");
              }}>
                Comenzar Gratis
              </Button>
              <Button size="lg" variant="outline" onClick={handleDemoClick}>
                Ver Demo
              </Button>
            </div>

            {/* Dashboard Preview */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 w-80 shadow-lg">
              <div className="text-sm font-semibold text-gray-600 mb-4">Vista previa del Dashboard</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <div>
                    <div className="text-xs text-emerald-600">Ingresos Mensuales</div>
                    <div className="text-lg font-bold text-emerald-800 animate-pulse">€12,450</div>
                  </div>
                  <span className="text-emerald-500 text-xl">↗️</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-xs text-blue-600">Ocupación</div>
                    <div className="text-lg font-bold text-blue-800 animate-pulse">92%</div>
                  </div>
                  <div className="w-8 h-3 bg-blue-500 rounded-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-4 bg-blue-300 animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="text-xs text-orange-600">Alertas</div>
                    <div className="text-lg font-bold text-orange-800 animate-pulse">2</div>
                  </div>
                  <div className="w-6 h-6 border-2 border-orange-500 rounded-full animate-ping" />
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
            Gestión completa de propiedades, inquilinos y mantenimiento
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Gestión de Propiedades</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Organiza propiedades con múltiples unidades e inquilinos en un solo lugar</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                <CardTitle>Gestión de Inquilinos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Administra inquilinos, contratos y seguimiento de pagos fácilmente</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <ClipboardList className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Registro de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Lleva un control claro de todos los pagos recibidos y pendientes</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Wrench className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <CardTitle>Solicitudes de Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Gestiona y da seguimiento a todas las solicitudes de mantenimiento</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Asistente IA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Consulta información de tus propiedades e inquilinos con lenguaje natural</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <CardTitle>Reportes y Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Análisis de rentabilidad y exportación de datos en PDF o Excel</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile Apps Section */}
      <section className="py-16 bg-gray-50">
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
                  <p className="text-lg font-bold">App Store (Próximamente)</p>
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

      {/* Contact Section */}
      <section id="contacto" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Contacto</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            ¿Tienes preguntas o quieres saber más sobre nuestros servicios? Escríbenos.
          </p>
          <div className="max-w-2xl mx-auto">
            <Card className="p-6">
              <form onSubmit={handleContactSubmit} className="grid gap-4 text-left">
                <input type="text" name="hp" className="hidden" tabIndex={-1} autoComplete="off" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" name="name" placeholder="Tu nombre" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Asunto (opcional)</Label>
                  <Input id="subject" name="subject" placeholder="Asunto" />
                </div>
                <div>
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Cuéntanos cómo podemos ayudarte"
                    rows={5}
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Enviar mensaje
                  </Button>
                  <a href="mailto:rentaflux@gmail.com" className="text-sm text-blue-600 hover:underline">
                    O escríbenos a rentaflux@gmail.com
                  </a>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">RentaFlux</h3>
              <p className="text-gray-400">
                La plataforma completa para la gestión de propiedades en alquiler.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Características</li>
                <li className="cursor-pointer hover:text-white" onClick={handleDemoClick}>Demo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#contacto" className="hover:text-white">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/privacy" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
                <li><a href="/legal" className="hover:text-white transition-colors">Aviso Legal</a></li>
                <li><a href="/cookies" className="hover:text-white transition-colors">Política de Cookies</a></li>
                <li><a href="/accessibility" className="hover:text-white transition-colors">Accesibilidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 RentaFlux. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
