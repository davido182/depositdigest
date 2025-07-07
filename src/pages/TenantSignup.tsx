
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { UserCheck, Home } from "lucide-react";

export default function TenantSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitationCode, setInvitationCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'signup' | 'success'>('code');
  
  const { signUp, signIn, acceptTenantInvitation, user } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInvitationCode(code);
    }
  }, [searchParams]);

  const handleValidateCode = async () => {
    if (!invitationCode.trim()) {
      toast.error("Por favor ingresa el código de invitación");
      return;
    }

    // If user is already logged in, just accept the invitation
    if (user) {
      handleAcceptInvitation();
      return;
    }

    setStep('signup');
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (fullName.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, fullName.trim());
      // After successful signup, sign in immediately
      await signIn(email, password);
      
      // Small delay to ensure auth state is updated
      setTimeout(handleAcceptInvitation, 1000);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Error al registrarse");
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    setIsLoading(true);
    try {
      const result = await acceptTenantInvitation(invitationCode);
      toast.success(`¡Bienvenido! Ahora eres inquilino de la unidad ${result.unit_number}`);
      setStep('success');
      
      // Redirect to tenant dashboard after a moment
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast.error(error.message || "Error al aceptar la invitación");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-green-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              ¡Registro Exitoso!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Te has registrado exitosamente como inquilino. 
              Serás redirigido a tu dashboard en un momento...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'code' ? 'Código de Invitación' : 'Registro de Inquilino'}
          </CardTitle>
          <CardDescription>
            {step === 'code' 
              ? 'Ingresa el código que recibiste de tu propietario'
              : 'Completa tu registro para acceder a tu unidad'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'code' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Código de Invitación</Label>
                <Input
                  id="code"
                  placeholder="Ingresa tu código"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono"
                />
              </div>
              <Button 
                onClick={handleValidateCode}
                className="w-full"
                size="lg"
              >
                Continuar
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Ej: Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Registrando..." : "Completar Registro"}
              </Button>
              
              <Button 
                onClick={() => setStep('code')}
                variant="ghost"
                className="w-full"
              >
                Volver al código
              </Button>
            </>
          )}
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto"
                onClick={() => navigate('/login')}
              >
                Iniciar Sesión
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
