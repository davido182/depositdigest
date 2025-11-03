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
            <CardTitle className="text-3xl">Política de Cookies</CardTitle>
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

            <h2>2. ¿Cómo Utilizamos las Cookies?</h2>
            <p>
              En RentaFlux utilizamos cookies únicamente para garantizar el funcionamiento técnico 
              de nuestra plataforma. No utilizamos cookies de seguimiento, publicitarias o de análisis 
              de terceros.
            </p>

            <h2>3. Tipos de Cookies que Utilizamos</h2>
            
            <h3>3.1 Cookies Técnicas Estrictamente Necesarias</h3>
            <p>
              Estas cookies son esenciales para que pueda navegar por la plataforma y utilizar sus 
              funciones. Sin estas cookies, no podríamos proporcionar los servicios solicitados.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Cookie</th>
                    <th className="text-left p-2">Propósito</th>
                    <th className="text-left p-2">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2"><code>session_token</code></td>
                    <td className="p-2">Mantener su sesión activa</td>
                    <td className="p-2">Sesión</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><code>auth_token</code></td>
                    <td className="p-2">Autenticación de usuario</td>
                    <td className="p-2">7 días</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><code>csrf_token</code></td>
                    <td className="p-2">Protección contra ataques CSRF</td>
                    <td className="p-2">Sesión</td>
                  </tr>
                  <tr>
                    <td className="p-2"><code>preferences</code></td>
                    <td className="p-2">Recordar configuraciones de la interfaz</td>
                    <td className="p-2">30 días</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>3.2 Cookies de Funcionalidad</h3>
            <p>
              Estas cookies permiten que la plataforma recuerde las elecciones que hace (como su idioma 
              preferido o la región en la que se encuentra) y proporcionan características mejoradas y 
              más personales.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Cookie</th>
                    <th className="text-left p-2">Propósito</th>
                    <th className="text-left p-2">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2"><code>language</code></td>
                    <td className="p-2">Recordar idioma preferido</td>
                    <td className="p-2">1 año</td>
                  </tr>
                  <tr>
                    <td className="p-2"><code>theme</code></td>
                    <td className="p-2">Recordar tema visual (claro/oscuro)</td>
                    <td className="p-2">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>4. Cookies de Terceros</h2>
            
            <h3>4.1 Supabase (Proveedor de Base de Datos)</h3>
            <p>
              Utilizamos Supabase para el almacenamiento y gestión de datos. Supabase puede establecer 
              cookies técnicas necesarias para el funcionamiento del servicio de autenticación.
            </p>

            <h3>4.2 Stripe (Procesamiento de Pagos)</h3>
            <p>
              Para el procesamiento seguro de pagos, utilizamos Stripe, que puede establecer cookies 
              necesarias para la seguridad y funcionamiento del sistema de pagos.
            </p>

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

            <h3>5.3 Consecuencias de Deshabilitar Cookies</h3>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800 font-semibold">⚠️ Importante:</p>
              <p className="text-red-700 text-sm mt-2">
                Si deshabilita las cookies técnicas necesarias, es posible que no pueda utilizar 
                todas las funciones de RentaFlux correctamente. Esto incluye:
              </p>
              <ul className="text-red-700 text-sm mt-2">
                <li>Iniciar sesión en su cuenta</li>
                <li>Mantener su sesión activa</li>
                <li>Realizar pagos de forma segura</li>
                <li>Guardar sus preferencias</li>
              </ul>
            </div>

            <h2>6. Cookies en Aplicaciones Móviles</h2>
            <p>
              Nuestras aplicaciones móviles nativas (iOS y Android) no utilizan cookies tradicionales, 
              sino que almacenan datos necesarios localmente en el dispositivo utilizando:
            </p>
            <ul>
              <li><strong>Local Storage:</strong> Para datos de sesión y preferencias</li>
              <li><strong>Secure Storage:</strong> Para tokens de autenticación</li>
              <li><strong>Cache:</strong> Para mejorar el rendimiento</li>
            </ul>

            <h2>7. Actualizaciones de esta Política</h2>
            <p>
              Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en 
              nuestras prácticas o por otras razones operativas, legales o reglamentarias.
            </p>

            <h2>8. Base Legal</h2>
            <p>
              El uso de cookies técnicas estrictamente necesarias se basa en nuestro interés legítimo 
              de proporcionar y mantener nuestros servicios. Para cookies de funcionalidad, solicitamos 
              su consentimiento cuando sea requerido por la ley.
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
                RentaFlux utiliza únicamente cookies técnicas necesarias para el funcionamiento de la 
                plataforma. No utilizamos cookies de seguimiento o publicitarias. Puede gestionar las 
                cookies desde la configuración de su navegador.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;