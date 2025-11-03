import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LegalNotice = () => {
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
            <CardTitle className="text-3xl">Aviso Legal</CardTitle>
            <p className="text-gray-600">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            
            <h2>1. Datos Identificativos</h2>
            <p>
              En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la 
              Sociedad de la Información y de Comercio Electrónico, se informa que:
            </p>
            <ul>
              <li><strong>Denominación social:</strong> RentaFlux</li>
              <li><strong>Dominio:</strong> www.rentaflux.com</li>
              <li><strong>Email de contacto:</strong> rentaflux@gmail.com</li>
              <li><strong>Actividad:</strong> Plataforma de gestión de propiedades en alquiler</li>
            </ul>

            <h2>2. Objeto</h2>
            <p>
              El presente aviso legal regula el uso del sitio web www.rentaflux.com y la aplicación móvil 
              RentaFlux (en adelante, "la Plataforma"), que RentaFlux pone a disposición de los usuarios 
              de Internet.
            </p>
            <p>
              La utilización de la Plataforma atribuye la condición de usuario del mismo e implica la 
              aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en este 
              Aviso Legal.
            </p>

            <h2>3. Condiciones de Uso</h2>
            
            <h3>3.1 Acceso y Uso</h3>
            <ul>
              <li>El acceso a la Plataforma es gratuito salvo en lo relativo al coste de la conexión</li>
              <li>El usuario se compromete a hacer un uso adecuado de los contenidos y servicios</li>
              <li>Queda prohibido el uso de la Plataforma para fines ilícitos o no autorizados</li>
            </ul>

            <h3>3.2 Obligaciones del Usuario</h3>
            <p>El usuario se compromete a:</p>
            <ul>
              <li>Proporcionar información veraz y actualizada</li>
              <li>No utilizar la Plataforma para actividades ilícitas</li>
              <li>No interferir con el funcionamiento de la Plataforma</li>
              <li>Respetar los derechos de propiedad intelectual</li>
              <li>No transmitir virus o código malicioso</li>
            </ul>

            <h2>4. Contenidos</h2>
            
            <h3>4.1 Contenidos de RentaFlux</h3>
            <p>
              RentaFlux se reserva el derecho a modificar, suspender o interrumpir, temporal o 
              definitivamente, los contenidos sin necesidad de previo aviso.
            </p>

            <h3>4.2 Contenidos del Usuario</h3>
            <p>
              Los usuarios son únicos responsables de los contenidos que publiquen en la Plataforma. 
              RentaFlux no se hace responsable de la veracidad, legalidad o actualidad de dichos contenidos.
            </p>

            <h2>5. Propiedad Intelectual e Industrial</h2>
            <p>
              Todos los contenidos de la Plataforma (textos, imágenes, sonidos, código fuente, marcas, 
              logotipos, etc.) son propiedad de RentaFlux o de terceros que han autorizado su uso, y están 
              protegidos por derechos de propiedad intelectual e industrial.
            </p>
            <p>
              Queda prohibida la reproducción, distribución, comunicación pública, transformación o 
              cualquier otra actividad que se pueda realizar con los contenidos sin autorización expresa.
            </p>

            <h2>6. Exclusión de Garantías y Responsabilidad</h2>
            
            <h3>6.1 Disponibilidad del Servicio</h3>
            <p>
              RentaFlux no garantiza la disponibilidad y continuidad del funcionamiento de la Plataforma. 
              No se hace responsable de los daños que puedan derivarse de la falta de disponibilidad o 
              de fallos técnicos.
            </p>

            <h3>6.2 Contenidos</h3>
            <p>
              RentaFlux no se responsabiliza de:
            </p>
            <ul>
              <li>La veracidad, exactitud o actualidad de los contenidos</li>
              <li>Los daños derivados del uso de la información contenida en la Plataforma</li>
              <li>Los contenidos de sitios web enlazados</li>
              <li>Los virus o elementos dañinos que puedan afectar al sistema informático</li>
            </ul>

            <h2>7. Modificaciones</h2>
            <p>
              RentaFlux se reserva el derecho de efectuar sin previo aviso las modificaciones que considere 
              oportunas en la Plataforma, pudiendo cambiar, suprimir o añadir tanto los contenidos y 
              servicios que se presten como la forma en la que éstos aparezcan presentados o localizados.
            </p>

            <h2>8. Enlaces</h2>
            <p>
              En el caso de que en la Plataforma se dispusiesen enlaces hacia otros sitios web, RentaFlux 
              no ejercerá ningún tipo de control sobre dichos sitios y contenidos. En ningún caso asumirá 
              responsabilidad alguna por los contenidos de algún enlace perteneciente a un sitio web ajeno.
            </p>

            <h2>9. Protección de Datos</h2>
            <p>
              Para información sobre el tratamiento de datos personales, consulte nuestra 
              <a href="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</a>.
            </p>

            <h2>10. Cookies</h2>
            <p>
              La Plataforma utiliza cookies técnicas necesarias para su funcionamiento. Para más información, 
              consulte nuestra <a href="/cookies" className="text-blue-600 hover:underline">Política de Cookies</a>.
            </p>

            <h2>11. Legislación Aplicable y Jurisdicción</h2>
            <p>
              La relación entre RentaFlux y el usuario se regirá por la normativa española vigente y 
              cualquier controversia se someterá a los Juzgados y Tribunales de España.
            </p>

            <h2>12. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con este Aviso Legal, puede contactar con nosotros en:
            </p>
            <ul>
              <li>Email: <strong>rentaflux@gmail.com</strong></li>
            </ul>

            <div className="bg-amber-50 p-4 rounded-lg mt-8">
              <h3 className="font-semibold text-amber-800 mb-2">Importante</h3>
              <p className="text-amber-700 text-sm">
                El uso de esta Plataforma implica la aceptación plena de este Aviso Legal. Si no está 
                de acuerdo con alguna de las condiciones, debe abstenerse de utilizar la Plataforma.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LegalNotice;