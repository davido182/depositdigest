import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CookiePolicy = () => {
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
            <CardTitle className="text-3xl">Política de Almacenamiento Local</CardTitle>
            <p className="text-gray-600">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            
            <h2>1. ¿Qué son las Cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita 
              un sitio web. Permiten que el sitio web recuerde sus acciones y preferencias durante un 
              período de tiempo, para que no tenga que volver a configurarlas cada vez que regrese al 
              sitio o navegue de una página a otra.
            </p>

            <h2>2. ¿Cómo Utilizamos las Cookies y Almacenamiento Local?</h2>
            <p>
              <strong>IMPORTANTE:</strong> RentaFlux NO utiliza cookies tradicionales. En su lugar, 
              utilizamos tecnologías de almacenamiento local del navegador (localStorage y sessionStorage) 
              que son técnicamente necesarias para el funcionamiento de la aplicación.
            </p>

            <h2>3. Tecnologías de Almacenamiento que Utilizamos</h2>
            
            <h3>3.1 Local Storage (Almacenamiento Local)</h3>
            <p>
              Utilizamos localStorage para almacenar datos que persisten entre sesiones del navegador. 
              Estos datos son esenciales para el funcionamiento de la aplicación.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Dato Almacenado</th>
                    <th className="text-left p-2">Propósito</th>
                    <th className="text-left p-2">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2"><code>rentaflux_has_visited</code></td>
                    <td className="p-2">Recordar si ha visitado la landing page</td>
                    <td className="p-2">Funcional</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><code>payment_records_*</code></td>
                    <td className="p-2">Datos de seguimiento de pagos</td>
                    <td className="p-2">Funcional</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><code>app-language</code></td>
                    <td className="p-2">Idioma preferido de la interfaz</td>
                    <td className="p-2">Preferencias</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><code>data_backups</code></td>
                    <td className="p-2">Respaldos locales de datos</td>
                    <td className="p-2">Funcional</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><code>security_events</code></td>
                    <td className="p-2">Registro de eventos de seguridad</td>
                    <td className="p-2">Seguridad</td>
                  </tr>
                  <tr>
                    <td className="p-2"><code>rentaflux_cookie_consent</code></td>
                    <td className="p-2">Su decisión sobre el consentimiento</td>
                    <td className="p-2">Legal</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>3.2 Session Storage (Almacenamiento de Sesión)</h3>
            <p>
              Utilizamos sessionStorage para datos temporales que solo duran mientras tiene 
              abierta la pestaña del navegador.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Dato Almacenado</th>
                    <th className="text-left p-2">Propósito</th>
                    <th className="text-left p-2">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2"><code>csrf_token</code></td>
                    <td className="p-2">Protección contra ataques CSRF</td>
                    <td className="p-2">Sesión</td>
                  </tr>
                  <tr>
                    <td className="p-2"><code>temp_session_data</code></td>
                    <td className="p-2">Datos temporales de la sesión</td>
                    <td className="p-2">Sesión</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>4. Servicios de Terceros</h2>
            
            <h3>4.1 Supabase (Proveedor de Base de Datos y Autenticación)</h3>
            <p>
              Utilizamos Supabase para autenticación y almacenamiento de datos. Supabase puede 
              utilizar su propio almacenamiento local para tokens de autenticación y gestión de sesiones. 
              Estos datos son técnicamente necesarios para el funcionamiento del servicio.
            </p>

            <h3>4.2 Stripe (Procesamiento de Pagos)</h3>
            <p>
              Para el procesamiento seguro de pagos, utilizamos Stripe. Cuando utiliza nuestro 
              sistema de pagos, Stripe puede establecer sus propias cookies y almacenamiento local 
              necesarios para la seguridad y funcionamiento del sistema de pagos.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-semibold">ℹ️ Aclaración Importante:</p>
              <p className="text-blue-700 text-sm mt-2">
                RentaFlux como aplicación web NO establece cookies tradicionales. Todo el almacenamiento 
                se realiza mediante localStorage y sessionStorage del navegador, que son tecnologías 
                diferentes a las cookies y no requieren el mismo tipo de consentimiento bajo la normativa europea.
              </p>
            </div>

            <h2>5. ¿Cómo Controlar las Cookies?</h2>
            
            <h3>5.1 Configuración del Navegador</h3>
            <p>
              Puede controlar y/o eliminar las cookies como desee. Puede eliminar todas las cookies 
              que ya están en su dispositivo y puede configurar la mayoría de los navegadores para 
              evitar que se coloquen.
            </p>

            <h3>5.2 Instrucciones por Navegador</h3>
            <ul>
              <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
              <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
            </ul>

            <h3>5.3 Consecuencias de Deshabilitar el Almacenamiento Local</h3>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800 font-semibold">⚠️ Importante:</p>
              <p className="text-red-700 text-sm mt-2">
                Si deshabilita el almacenamiento local en su navegador, RentaFlux no funcionará 
                correctamente. Esto afectará:
              </p>
              <ul className="text-red-700 text-sm mt-2">
                <li>Iniciar sesión y mantener su sesión activa</li>
                <li>Guardar datos de pagos y seguimiento</li>
                <li>Recordar sus preferencias de idioma</li>
                <li>Funciones de respaldo y seguridad</li>
                <li>Realizar pagos de forma segura</li>
              </ul>
            </div>

            <h2>6. Almacenamiento en Aplicaciones Móviles</h2>
            <p>
              Nuestras aplicaciones móviles nativas (iOS y Android) utilizan almacenamiento local 
              del dispositivo en lugar de cookies:
            </p>
            <ul>
              <li><strong>Secure Storage:</strong> Para tokens de autenticación y datos sensibles</li>
              <li><strong>Local Database:</strong> Para datos de la aplicación (SQLite)</li>
              <li><strong>Preferences:</strong> Para configuraciones del usuario</li>
              <li><strong>Cache:</strong> Para mejorar el rendimiento y funcionalidad offline</li>
            </ul>

            <h2>7. Actualizaciones de esta Política</h2>
            <p>
              Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en 
              nuestras prácticas o por otras razones operativas, legales o reglamentarias.
            </p>

            <h2>8. Base Legal</h2>
            <p>
              El uso de almacenamiento local (localStorage y sessionStorage) se basa en nuestro 
              interés legítimo de proporcionar y mantener nuestros servicios. Estas tecnologías 
              son técnicamente necesarias para el funcionamiento de la aplicación web y no están 
              sujetas a los mismos requisitos de consentimiento que las cookies bajo la Directiva ePrivacy.
            </p>

            <h2>9. Contacto</h2>
            <p>
              Si tiene preguntas sobre nuestra Política de Cookies, puede contactarnos en:
            </p>
            <ul>
              <li>Email: <strong>rentaflux@gmail.com</strong></li>
            </ul>

            <div className="bg-blue-50 p-4 rounded-lg mt-8">
              <h3 className="font-semibold text-blue-800 mb-2">Resumen</h3>
              <p className="text-blue-700 text-sm">
                RentaFlux NO utiliza cookies tradicionales. Utilizamos únicamente almacenamiento local 
                del navegador (localStorage/sessionStorage) que es técnicamente necesario para el 
                funcionamiento de la aplicación. No utilizamos tecnologías de seguimiento o publicitarias.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;