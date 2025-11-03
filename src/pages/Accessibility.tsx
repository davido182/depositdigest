import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Accessibility = () => {
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
            <CardTitle className="text-3xl">Declaración de Accesibilidad</CardTitle>
            <p className="text-gray-600">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            
            <h2>1. Compromiso con la Accesibilidad</h2>
            <p>
              RentaFlux se compromete a garantizar que nuestra plataforma web y aplicaciones móviles 
              sean accesibles para todas las personas, incluidas aquellas con discapacidades. 
              Trabajamos continuamente para mejorar la experiencia de usuario para todos.
            </p>

            <h2>2. Estándares de Accesibilidad</h2>
            <p>
              Nos esforzamos por cumplir con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 
              nivel AA, que son reconocidas internacionalmente como el estándar para la accesibilidad web.
            </p>

            <h2>3. Medidas de Accesibilidad Implementadas</h2>
            
            <h3>3.1 Navegación y Estructura</h3>
            <ul>
              <li><strong>Navegación por teclado:</strong> Toda la funcionalidad es accesible usando solo el teclado</li>
              <li><strong>Orden de tabulación lógico:</strong> Los elementos se pueden navegar en un orden coherente</li>
              <li><strong>Enlaces descriptivos:</strong> Todos los enlaces tienen texto descriptivo claro</li>
              <li><strong>Encabezados estructurados:</strong> Uso correcto de etiquetas de encabezado (H1, H2, etc.)</li>
            </ul>

            <h3>3.2 Contenido Visual</h3>
            <ul>
              <li><strong>Contraste de colores:</strong> Cumplimos con los ratios mínimos de contraste WCAG AA</li>
              <li><strong>Texto alternativo:</strong> Todas las imágenes tienen descripciones alternativas apropiadas</li>
              <li><strong>Escalabilidad:</strong> El texto se puede ampliar hasta un 200% sin pérdida de funcionalidad</li>
              <li><strong>Indicadores de foco:</strong> Elementos enfocados tienen indicadores visuales claros</li>
            </ul>

            <h3>3.3 Formularios</h3>
            <ul>
              <li><strong>Etiquetas descriptivas:</strong> Todos los campos tienen etiquetas claras y asociadas</li>
              <li><strong>Instrucciones claras:</strong> Proporcionamos instrucciones y ayuda contextual</li>
              <li><strong>Validación accesible:</strong> Los errores se comunican de manera clara y accesible</li>
              <li><strong>Agrupación lógica:</strong> Los campos relacionados están agrupados apropiadamente</li>
            </ul>

            <h3>3.4 Tecnologías Asistivas</h3>
            <ul>
              <li><strong>Lectores de pantalla:</strong> Compatible con NVDA, JAWS, VoiceOver y TalkBack</li>
              <li><strong>ARIA labels:</strong> Uso apropiado de atributos ARIA para mejorar la semántica</li>
              <li><strong>Roles y propiedades:</strong> Implementación correcta de roles ARIA</li>
              <li><strong>Anuncios dinámicos:</strong> Los cambios de contenido se comunican a lectores de pantalla</li>
            </ul>

            <h2>4. Funcionalidades de Accesibilidad</h2>
            
            <h3>4.1 Opciones de Personalización</h3>
            <ul>
              <li>Modo de alto contraste</li>
              <li>Ajuste del tamaño de fuente</li>
              <li>Reducción de animaciones</li>
              <li>Navegación simplificada</li>
            </ul>

            <h3>4.2 Atajos de Teclado</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Atajo</th>
                    <th className="text-left p-2">Función</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2"><kbd>Tab</kbd></td>
                    <td className="p-2">Navegar al siguiente elemento</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><kbd>Shift + Tab</kbd></td>
                    <td className="p-2">Navegar al elemento anterior</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><kbd>Enter</kbd></td>
                    <td className="p-2">Activar botones y enlaces</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><kbd>Espacio</kbd></td>
                    <td className="p-2">Activar botones y checkboxes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2"><kbd>Esc</kbd></td>
                    <td className="p-2">Cerrar diálogos y menús</td>
                  </tr>
                  <tr>
                    <td className="p-2"><kbd>Alt + M</kbd></td>
                    <td className="p-2">Ir al menú principal</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>5. Aplicaciones Móviles</h2>
            <p>
              Nuestras aplicaciones móviles (iOS y Android) incluyen:
            </p>
            <ul>
              <li><strong>VoiceOver (iOS):</strong> Soporte completo para el lector de pantalla nativo</li>
              <li><strong>TalkBack (Android):</strong> Compatible con el servicio de accesibilidad de Android</li>
              <li><strong>Navegación por gestos:</strong> Soporte para gestos de accesibilidad estándar</li>
              <li><strong>Texto dinámico:</strong> Respeta las preferencias de tamaño de texto del sistema</li>
              <li><strong>Reducción de movimiento:</strong> Respeta las preferencias de animación del usuario</li>
            </ul>

            <h2>6. Limitaciones Conocidas</h2>
            <p>
              Aunque nos esforzamos por la máxima accesibilidad, reconocemos las siguientes limitaciones actuales:
            </p>
            <ul>
              <li>Algunos gráficos complejos pueden requerir descripciones adicionales</li>
              <li>Ciertas funciones de arrastrar y soltar tienen alternativas de teclado limitadas</li>
              <li>Algunos contenidos de terceros (como mapas) pueden tener limitaciones de accesibilidad</li>
            </ul>

            <h2>7. Evaluación y Pruebas</h2>
            <p>
              Realizamos evaluaciones regulares de accesibilidad que incluyen:
            </p>
            <ul>
              <li>Auditorías automáticas con herramientas especializadas</li>
              <li>Pruebas manuales con tecnologías asistivas</li>
              <li>Revisiones de código para cumplimiento de estándares</li>
              <li>Pruebas de usuario con personas con discapacidades</li>
            </ul>

            <h2>8. Mejora Continua</h2>
            <p>
              Nuestro compromiso con la accesibilidad es continuo. Regularmente:
            </p>
            <ul>
              <li>Actualizamos nuestras prácticas según los últimos estándares</li>
              <li>Capacitamos a nuestro equipo en diseño y desarrollo accesible</li>
              <li>Incorporamos feedback de usuarios con discapacidades</li>
              <li>Monitoreamos y corregimos problemas de accesibilidad</li>
            </ul>

            <h2>9. Comentarios y Soporte</h2>
            <p>
              Valoramos sus comentarios sobre la accesibilidad de RentaFlux. Si encuentra barreras 
              de accesibilidad o tiene sugerencias de mejora, por favor contáctenos:
            </p>
            <ul>
              <li><strong>Email:</strong> rentaflux@gmail.com</li>
              <li><strong>Asunto:</strong> "Accesibilidad - [Descripción del problema]"</li>
            </ul>

            <p>
              Nos comprometemos a responder a todas las consultas de accesibilidad dentro de 5 días hábiles 
              y a trabajar en soluciones apropiadas.
            </p>

            <h2>10. Recursos Adicionales</h2>
            <p>
              Para obtener más información sobre accesibilidad web:
            </p>
            <ul>
              <li><a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Guía rápida WCAG 2.1</a></li>
              <li><a href="https://webaim.org/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">WebAIM - Recursos de accesibilidad</a></li>
              <li><a href="https://www.fundaciononce.es/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Fundación ONCE - Accesibilidad</a></li>
            </ul>

            <div className="bg-blue-50 p-4 rounded-lg mt-8">
              <h3 className="font-semibold text-blue-800 mb-2">Nuestro Compromiso</h3>
              <p className="text-blue-700 text-sm">
                La accesibilidad no es solo una característica técnica para nosotros, es un derecho 
                fundamental. Trabajamos continuamente para que RentaFlux sea una plataforma inclusiva 
                y accesible para todos los usuarios.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Accessibility;