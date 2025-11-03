import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
            <CardTitle className="text-3xl">Política de Privacidad</CardTitle>
            <p className="text-gray-600">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            
            <h2>1. Responsable del Tratamiento</h2>
            <p>
              <strong>RentaFlux</strong><br />
              Email: rentaflux@gmail.com<br />
              Sitio web: www.rentaflux.com
            </p>

            <h2>2. Información que Recopilamos</h2>
            
            <h3>2.1 Datos de Registro</h3>
            <ul>
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Contraseña (encriptada)</li>
              <li>Información de contacto</li>
            </ul>

            <h3>2.2 Datos de Propiedades e Inquilinos</h3>
            <ul>
              <li>Información de propiedades (direcciones, características)</li>
              <li>Datos de inquilinos (nombres, contactos, información de contratos)</li>
              <li>Registros de pagos y transacciones</li>
              <li>Solicitudes de mantenimiento</li>
            </ul>

            <h3>2.3 Datos Técnicos</h3>
            <ul>
              <li>Dirección IP</li>
              <li>Información del navegador</li>
              <li>Datos de uso de la aplicación</li>
              <li>Cookies técnicas necesarias</li>
            </ul>

            <h2>3. Base Legal para el Tratamiento</h2>
            <p>Tratamos sus datos personales basándonos en:</p>
            <ul>
              <li><strong>Consentimiento:</strong> Para el registro y uso de nuestros servicios</li>
              <li><strong>Ejecución de contrato:</strong> Para proporcionar los servicios contratados</li>
              <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios y seguridad</li>
              <li><strong>Obligación legal:</strong> Para cumplir con requisitos fiscales y contables</li>
            </ul>

            <h2>4. Finalidades del Tratamiento</h2>
            <ul>
              <li>Proporcionar y mantener nuestros servicios</li>
              <li>Gestionar su cuenta de usuario</li>
              <li>Procesar pagos y transacciones</li>
              <li>Enviar comunicaciones importantes sobre el servicio</li>
              <li>Proporcionar soporte técnico</li>
              <li>Cumplir con obligaciones legales</li>
              <li>Mejorar nuestros servicios (datos anonimizados)</li>
            </ul>

            <h2>5. Compartir Información</h2>
            <p>No vendemos, alquilamos ni compartimos su información personal con terceros, excepto:</p>
            <ul>
              <li><strong>Proveedores de servicios:</strong> Supabase (base de datos), Stripe (pagos)</li>
              <li><strong>Obligaciones legales:</strong> Cuando sea requerido por ley</li>
              <li><strong>Consentimiento:</strong> Cuando usted nos autorice expresamente</li>
            </ul>

            <h2>6. Transferencias Internacionales</h2>
            <p>
              Sus datos pueden ser procesados en servidores ubicados fuera del Espacio Económico Europeo (EEE). 
              Garantizamos que estas transferencias cumplen con el GDPR mediante:
            </p>
            <ul>
              <li>Cláusulas contractuales tipo aprobadas por la Comisión Europea</li>
              <li>Certificaciones de adecuación</li>
              <li>Medidas de seguridad adicionales</li>
            </ul>

            <h2>7. Retención de Datos</h2>
            <ul>
              <li><strong>Datos de cuenta:</strong> Mientras mantenga su cuenta activa</li>
              <li><strong>Datos financieros:</strong> 6 años (obligación legal fiscal)</li>
              <li><strong>Datos de soporte:</strong> 3 años desde la última interacción</li>
              <li><strong>Datos técnicos:</strong> 12 meses máximo</li>
            </ul>

            <h2>8. Sus Derechos (GDPR)</h2>
            <p>Usted tiene derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
              <li><strong>Limitación:</strong> Restringir el procesamiento de sus datos</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
              <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
              <li><strong>Retirar consentimiento:</strong> En cualquier momento</li>
            </ul>

            <p>Para ejercer estos derechos, contacte: <strong>rentaflux@gmail.com</strong></p>

            <h2>9. Seguridad</h2>
            <p>Implementamos medidas técnicas y organizativas apropiadas:</p>
            <ul>
              <li>Encriptación de datos en tránsito y en reposo</li>
              <li>Autenticación de dos factores</li>
              <li>Acceso restringido a datos personales</li>
              <li>Auditorías regulares de seguridad</li>
              <li>Formación del personal en protección de datos</li>
            </ul>

            <h2>10. Cookies</h2>
            <p>
              Utilizamos cookies técnicas estrictamente necesarias para el funcionamiento del servicio. 
              Para más información, consulte nuestra <a href="/cookies" className="text-blue-600 hover:underline">Política de Cookies</a>.
            </p>

            <h2>11. Menores de Edad</h2>
            <p>
              Nuestros servicios no están dirigidos a menores de 16 años. No recopilamos 
              intencionalmente información personal de menores de 16 años.
            </p>

            <h2>12. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Le notificaremos cambios significativos 
              por email o mediante aviso en la aplicación.
            </p>

            <h2>13. Contacto y Reclamaciones</h2>
            <p>
              Para cualquier consulta sobre esta política o el tratamiento de sus datos:
            </p>
            <ul>
              <li>Email: <strong>rentaflux@gmail.com</strong></li>
              <li>También puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD)</li>
            </ul>

            <div className="bg-blue-50 p-4 rounded-lg mt-8">
              <h3 className="font-semibold text-blue-800 mb-2">Resumen de sus derechos</h3>
              <p className="text-blue-700 text-sm">
                Tiene derecho a acceder, rectificar, suprimir, limitar, portar y oponerse al tratamiento 
                de sus datos personales, así como a retirar su consentimiento. Para ejercer estos derechos, 
                contacte con nosotros en rentaflux@gmail.com.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;