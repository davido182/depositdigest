import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

type Stage = "loading" | "form" | "success" | "invalid";


// ── Shared wrapper ──────────────────────────────────────────────────────
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #eff6ff 0%, #f8faff 50%, #faf5ff 100%)",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
            }}
          >
            <Building2 style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>
            RentaFlux
          </h1>
        </div>
        {children}
      </div>
    </div>
  );

const ResetPassword = () => {
  const navigate = useNavigate();
  const { isPasswordRecovery, user } = useAuth();

  const [stage, setStage] = useState<Stage>("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * Supabase sends a link like:
   *   https://yourdomain.com/reset-password#access_token=...&type=recovery
   *
   * When Supabase JS picks this up it fires the PASSWORD_RECOVERY event in
   * AuthContext, which sets isPasswordRecovery = true and replaces the URL
   * to /reset-password (without the hash).
   *
   * We wait up to 6 seconds for that handshake. If it doesn't arrive the
   * link is expired or invalid.
   */
  useEffect(() => {
    // If the context already knows we're in recovery mode, show the form
    if (isPasswordRecovery && user) {
      setStage("form");
      return;
    }

    // Give Supabase time to process the token from the URL hash
    const timeout = setTimeout(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
        setStage("form");
        } else {
        setStage("invalid");
        }
    });
    }, 2500);

    return () => clearTimeout(timeout);
  }, [isPasswordRecovery, user]);

  // Also react if isPasswordRecovery becomes true while we're still in loading
  useEffect(() => {
    if (isPasswordRecovery && user && stage === "loading") {
      setStage("form");
    }
  }, [isPasswordRecovery, user, stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setStage("success");
      toast.success("¡Contraseña actualizada!");

      // Sign out so the user logs in cleanly with the new password
      await supabase.auth.signOut();

      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      console.error("Error updating password:", err);
      toast.error("Error al actualizar: " + (err.message || "Inténtalo de nuevo"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = (() => {
    if (newPassword.length === 0) return null;
    if (newPassword.length < 6) return { label: "Muy corta", color: "#ef4444", width: "25%" };
    if (newPassword.length < 8) return { label: "Débil", color: "#f97316", width: "50%" };
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return { label: "Media", color: "#eab308", width: "75%" };
    return { label: "Fuerte", color: "#22c55e", width: "100%" };
  })();

  // ── Shared wrapper ──────────────────────────────────────────────────────
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #eff6ff 0%, #f8faff 50%, #faf5ff 100%)",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
            }}
          >
            <Building2 style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>
            RentaFlux
          </h1>
        </div>
        {children}
      </div>
    </div>
  );

  // ── Loading ─────────────────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <Wrapper>
        <Card>
          <CardContent style={{ textAlign: "center", padding: "40px 24px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid #e5e7eb",
                borderTop: "3px solid #2563eb",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "#6b7280", margin: 0 }}>Verificando enlace…</p>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  // ── Invalid / expired ───────────────────────────────────────────────────
  if (stage === "invalid") {
    return (
      <Wrapper>
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#dc2626" }}>Enlace inválido o expirado</CardTitle>
            <CardDescription>
              Este enlace de recuperación ya no es válido. Los enlaces expiran después de 1 hora.
            </CardDescription>
          </CardHeader>
          <CardFooter style={{ flexDirection: "column", gap: 8 }}>
            <Button
              className="w-full"
              onClick={() => navigate("/login")}
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                border: "none",
                color: "#fff",
              }}
            >
              Solicitar nuevo enlace
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </Wrapper>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <Wrapper>
        <Card>
          <CardContent style={{ textAlign: "center", padding: "40px 24px" }}>
            <CheckCircle2
              style={{ width: 52, height: 52, color: "#22c55e", margin: "0 auto 16px" }}
            />
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>¡Contraseña actualizada!</h2>
            <p style={{ color: "#6b7280", marginBottom: 0 }}>
              Redirigiendo al inicio de sesión…
            </p>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <Wrapper>
      <Card>
        <CardHeader>
          <CardTitle>Nueva contraseña</CardTitle>
          <CardDescription>
            Elige una contraseña segura para tu cuenta{user?.email ? ` (${user.email})` : ""}.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* New password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="new-pw">Nueva contraseña</Label>
              <div style={{ position: "relative" }}>
                <Input
                  id="new-pw"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    padding: 0,
                  }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {strength && (
                <div>
                  <div
                    style={{
                      height: 4,
                      background: "#e5e7eb",
                      borderRadius: 4,
                      overflow: "hidden",
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: strength.width,
                        background: strength.color,
                        borderRadius: 4,
                        transition: "width 0.3s ease, background 0.3s ease",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: strength.color, fontWeight: 600 }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="confirm-pw">Confirmar contraseña</Label>
              <div style={{ position: "relative" }}>
                <Input
                  id="confirm-pw"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    paddingRight: 40,
                    borderColor:
                      confirmPassword && newPassword !== confirmPassword
                        ? "#ef4444"
                        : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    padding: 0,
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>
                  Las contraseñas no coinciden
                </span>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !newPassword || !confirmPassword}
              style={{
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              {isSubmitting ? "Actualizando…" : "Guardar nueva contraseña"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </Wrapper>
  );
};

export default ResetPassword;
