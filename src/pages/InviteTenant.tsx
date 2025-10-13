
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, Send, UserPlus } from "lucide-react";

export default function InviteTenant() {
  const [unit_number, setunit_number] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const { createTenantInvitation } = useAuth();

  const handleCreateInvitation = async () => {
    if (!unit_number.trim()) {
      toast.error("El número de unidad es obligatorio");
      return;
    }

    setIsLoading(true);
    try {
      const data = await createTenantInvitation(unit_number, email || undefined);
      setInvitationData(data);
      toast.success("Invitación creada exitosamente");
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      toast.error(error.message || "Error al crear la invitación");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const sendEmailInvitation = () => {
    if (invitationData && email) {
      const subject = encodeURIComponent(`Invitación para unirse a RentaFlux - Unidad ${unit_number}`);
      const body = encodeURIComponent(
        `Hola,\n\nHas sido invitado/a a unirte a RentaFlux como inquilino de la unidad ${unit_number}.\n\n` +
        `Usa este enlace para registrarte:\n${invitationData.invitation_link}\n\n` +
        `O ingresa el código de invitación: ${invitationData.invitation_code}\n\n` +
        `Esta invitación expira el: ${new Date(invitationData.expires_at).toLocaleDateString()}\n\n` +
        `¡Saludos!`
      );
      window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Invitar Inquilino</h1>
            <p className="text-muted-foreground">
              Crea una invitación para que un inquilino se registre en tu propiedad
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Invitación</CardTitle>
            <CardDescription>
              Genera un código de invitación para un inquilino específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit_number">Número de Unidad *</Label>
              <Input
                id="unit_number"
                placeholder="Ej: 101, A-1, Casa 5"
                value={unit_number}
                onChange={(e) => setunit_number(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email del Inquilino (Opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="inquilino@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Si proporcionas un email, podrás enviar la invitación directamente
              </p>
            </div>

            <Button 
              onClick={handleCreateInvitation}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creando..." : "Crear Invitación"}
            </Button>
          </CardContent>
        </Card>

        {invitationData && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">¡Invitación Creada!</CardTitle>
              <CardDescription className="text-green-700">
                Comparte esta información con tu inquilino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Código de Invitación</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={invitationData.invitation_code} 
                      readOnly 
                      className="bg-white"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(invitationData.invitation_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Enlace de Invitación</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={invitationData.invitation_link} 
                      readOnly 
                      className="bg-white text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(invitationData.invitation_link)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>Expira:</strong> {new Date(invitationData.expires_at).toLocaleString()}
                </div>
              </div>

              {email && (
                <Button 
                  onClick={sendEmailInvitation}
                  className="w-full"
                  variant="default"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar por Email a {email}
                </Button>
              )}

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Instrucciones para el inquilino:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Visitar el enlace de invitación o ir a la app</li>
                  <li>2. Registrarse con una cuenta nueva</li>
                  <li>3. Ingresar el código de invitación</li>
                  <li>4. ¡Listo! Tendrá acceso a su unidad</li>
                </ul>
              </div>

              <Button 
                onClick={() => {
                  setInvitationData(null);
                  setunit_number("");
                  setEmail("");
                }}
                variant="outline"
                className="w-full"
              >
                Crear Otra Invitación
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
