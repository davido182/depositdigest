import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Términos y Condiciones de Uso</CardTitle>
            <p className="text-gray-600">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            
            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar RentaFlux (la "Plataforma"), usted acepta estar sujeto a estos 
              Términos y Condiciones de Uso. Si no está de acuerdo con alguno de estos términos, 
              no debe utilizar nuestros servicios.
            </p>

            <h2>2. Descripción del Servicio</h2>
            <p>
              RentaFlux es una plataforma digital que permite a propietarios de inmuebles gestionar 
              sus propiedades en alquiler, incluyendo:
            </p>
            <ul>
              <li>Gestión de inquilinos y contratos</li>
              <li>Seguimiento de pagos y rentas</li>
              <li>Solicitudes de mantenimiento</li>
              <li>Reportes y análisis financieros</li>
              <li>Comunicación entre propietarios e inquilinos</li>
            </ul>

            <h2>3. Registro y Cuenta de Usuario</h2>
            
            <h3>3.1 Elegibilidad</h3>
            <p>
              Para utilizar RentaFlux, debe ser mayor de 18 años y tener capacidad legal para 
              celebrar contratos vinculantes.
            </p>

            <h3>3.2 Información de Registro</h3>
            <p>
              Debe proporcionar información precisa, completa y actualizada durante el registro. 
              Es responsable de mantener la confidencialidad de su cuenta y contraseña.
            </p>

            <h3>3.3 Responsabilidad de la Cuenta</h3>
            <p>
              Usted es responsable de todas las actividades que ocurran bajo su cuenta. Debe 
              notificarnos inmediatamente sobre cualquier uso no autorizado.
            </p>

            <h2>4. Planes y Pagos</h2>
            
            <h3>4.1 Plan Gratuito</h3>
            <ul>
              <li>Acceso limitado a funcionalidades básicas</li>
              <li>Máximo 1 propiedad con hasta 3 unidades</li>
              <li>Funciones básicas de gestión</li>
            </ul>

            <h3>4.2 Plan Premium</h3>
            <ul>
              <li>Acceso completo a todas las funcionalidades</li>
              <li>Propiedades y unidades ilimitadas</li>
              <li>Funciones avanzadas de contabilidad y análisis</li>
              <li>Soporte prioritario</li>
            </ul>

            <h3>4.3 Facturación</h3>
            <p>
              Los pagos se procesan de forma segura a través de Stripe. Los precios pueden cambiar 
              con previo aviso de 30 días.
            </p>

            <h2>5. Uso Aceptable</h2>
            
            <h3>5.1 Usos Permitidos</h3>
            <p>Puede utilizar RentaFlux únicamente para:</p>
            <ul>
              <li>Gestionar propiedades inmobiliarias legítimas</li>
              <li>Comunicarse con inquilinos de manera profesional</li>
              <li>Generar reportes para fines contables y fiscales</li>
            </ul>

            <h3>5.2 Usos Prohibidos</h3>
            <p>No puede utilizar RentaFlux para:</p>
            <ul>
              <li>Actividades ilegales o fraudulentas</li>
              <li>Discriminación por raza, género, religión, etc.</li>
              <li>Acoso o intimidación de otros usuarios</li>
              <li>Violación de derechos de propiedad intelectual</li>
              <li>Transmisión de malware o código malicioso</li>
              <li>Intentos de acceso no autorizado al sistema</li>
            </ul>

            <h2>6. Contenido del Usuario</h2>
            
            <h3>6.1 Propiedad del Contenido</h3>
            <p>
              Usted conserva todos los derechos sobre el contenido que sube a la Plataforma 
              (datos de propiedades, inquilinos, etc.).
            </p>

            <h3>6.2 Licencia de Uso</h3>
            <p>
              Al subir contenido, nos otorga una licencia limitada para procesar, almacenar y 
              mostrar dicho contenido únicamente para proporcionar nuestros servicios.
            </p>

            <h3>6.3 Responsabilidad del Contenido</h3>
            <p>
              Usted es el único responsable de la exactitud, legalidad y actualidad de su contenido. 
              No verificamos la veracidad de la información proporcionada.
            </p>

            <h2>7. Privacidad y Protección de Datos</h2>
            <p>
              El tratamiento de sus datos personales se rige por nuestra 
              <a href="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</a>, 
              que forma parte integral de estos términos.
            </p>

            <h2>8. Limitación de Responsabilidad</h2>
            
            <h3>8.1 Disponibilidad del Servicio</h3>
            <p>
              Nos esforzamos por mantener la Plataforma disponible 24/7, pero no garantizamos 
              un tiempo de actividad del 100%. Podemos realizar mantenimientos programados.
            </p>

            <h3>8.2 Exclusión de Garantías</h3>
            <p>
              La Plataforma se proporciona "tal como está" sin garantías de ningún tipo. No 
              garantizamos que sea libre de errores o interrupciones.
            </p>

            <h3>8.3 Limitación de Daños</h3>
            <p>
              En ningún caso seremos responsables de daños indirectos, incidentales, especiales 
              o consecuentes, incluyendo pérdida de beneficios o datos.
            </p>

            <h2>9. Terminación</h2>
            
            <h3>9.1 Terminación por el Usuario</h3>
            <p>
              Puede cancelar su cuenta en cualquier momento desde la configuración de su perfil 
              o contactándonos directamente.
            </p>

            <h3>9.2 Terminación por RentaFlux</h3>
            <p>
              Podemos suspender o terminar su cuenta si viola estos términos o por razones 
              operativas con previo aviso cuando sea posible.
            </p>

            <h3>9.3 Efectos de la Terminación</h3>
            <p>
              Tras la terminación, perderá el acceso a la Plataforma. Puede solicitar una 
              exportación de sus datos antes de la eliminación definitiva.
            </p>

            <h2>10. Propiedad Intelectual</h2>
            <p>
              RentaFlux, su logotipo, diseño y funcionalidades son propiedad nuestra y están 
              protegidos por derechos de autor y otras leyes de propiedad intelectual.
            </p>

            <h2>11. Modificaciones</h2>
            <p>
              Podemos modificar estos términos ocasionalmente. Le notificaremos cambios 
              significativos por email o mediante aviso en la Plataforma con al menos 30 días 
              de antelación.
            </p>

            <h2>12. Legislación Aplicable</h2>
            <p>
              Estos términos se rigen por las leyes españolas. Cualquier disputa se resolverá 
              en los tribunales competentes de España.
            </p>

            <h2>13. Divisibilidad</h2>
            <p>
              Si alguna disposición de estos términos se considera inválida, el resto permanecerá 
              en pleno vigor y efecto.
            </p>

            <h2>14. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos:
            </p>
            <ul>
              <li>Email: <strong>rentaflux@gmail.com</strong></li>
            </ul>

            <div className="bg-green-50 p-4 rounded-lg mt-8">
              <h3 className="font-semibold text-green-800 mb-2">Compromiso de RentaFlux</h3>
              <p className="text-green-700 text-sm">
                Nos comprometemos a proporcionar un servicio confiable, seguro y transparente 
                para la gestión de sus propiedades. Su confianza es nuestra prioridad.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;