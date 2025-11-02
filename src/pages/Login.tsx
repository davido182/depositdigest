import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AuthDebugInfo } from "@/components/AuthDebugInfo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const { signIn, signUp, resetPassword, user, isPasswordRecovery, isInitialized, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Simple auth check - no complex logic
  useEffect(() => {
    if (isInitialized && user && !isPasswordRecovery && !authLoading) {
      console.log('🔄 Login: Navegando al dashboard');
      navigate("/dashboard");
    }
    
    if (isPasswordRecovery && user) {
      toast.info("Ahora puedes establecer tu nueva contraseña");
    }
  }, [user, isPasswordRecovery, isInitialized, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor ingresa email y contraseña");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      toast.success("Sesión iniciada exitosamente");
      // Navigation handled by useEffect
    } catch (error: any) {
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("Email o contraseña incorrectos");
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error("Por favor confirma tu email antes de iniciar sesión");
      } else {
        toast.error("Error al iniciar sesión: " + (error.message || "Error desconocido"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(email, password, fullName);
      toast.success("Cuenta creada exitosamente. Revisa tu email para confirmar la cuenta.");
    } catch (error: any) {
      console.error("SignUp error:", error);
      if (error.message?.includes("User already registered")) {
        toast.error("Este email ya está registrado. Intenta iniciar sesión.");
      } else {
        toast.error("Error al crear cuenta: " + (error.message || "Error desconocido"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor ingresa tu email");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      toast.success("Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.");
      setShowResetForm(false);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error("Error al enviar email de recuperación: " + (error.message || "Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error("Por favor completa ambos campos de contraseña");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updatePassword(newPassword);
      toast.success("Contraseña actualizada exitosamente");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error("Error al actualizar contraseña: " + (error.message || "Error desconocido"));
    } finally {
      setIsLoading(false);
    }
  };

  // Show password reset form if requested
  if (showResetForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/logo-rentaflux.ico" 
                alt="RentaFlux Logo" 
                className="h-8 w-8 mr-2"
              />
              <h1 className="text-2xl font-bold tracking-tight">RentaFlux</h1>
            </div>
            <p className="text-muted-foreground">Recuperar contraseña</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recuperar Contraseña</CardTitle>
              <CardDescription>
                Ingresa tu email para recibir un enlace de recuperación
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handlePasswordReset}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowResetForm(false)}
                >
                  Volver al Login
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Show password update form if in recovery mode
  if (isPasswordRecovery && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/logo-rentaflux.ico" 
                alt="RentaFlux Logo" 
                className="h-8 w-8 mr-2"
              />
              <h1 className="text-2xl font-bold tracking-tight">RentaFlux</h1>
            </div>
            <p className="text-muted-foreground">Establecer nueva contraseña</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Nueva Contraseña</CardTitle>
              <CardDescription>
                Ingresa tu nueva contraseña para {user.email}
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handlePasswordUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  La contraseña debe tener al menos 6 caracteres.
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <AuthDebugInfo />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo-rentaflux.ico" 
              alt="RentaFlux Logo" 
              className="h-8 w-8 mr-2"
            />
            <h1 className="text-2xl font-bold tracking-tight">RentaFlux</h1>
          </div>
          <p className="text-muted-foreground">Gestiona tus propiedades de alquiler con facilidad</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión o crea una cuenta para acceder a tu panel
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mx-6">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Contraseña</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-sm"
                      onClick={() => setShowResetForm(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    La contraseña debe tener al menos 6 caracteres.
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Login;
