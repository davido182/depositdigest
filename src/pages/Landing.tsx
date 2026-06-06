import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Building2,
  BarChart3,
  MessageCircle,
  Smartphone,
  Users,
  Wrench,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

/* ─────────────────────────────────────────
   Inline styles for CSS-only animations
   (no extra libraries, no layout shift)
───────────────────────────────────────── */
const styles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.5); opacity: 0; }
  }
  .anim-fade-up   { animation: fadeUp 0.7s ease both; }
  .anim-delay-1   { animation-delay: 0.1s; }
  .anim-delay-2   { animation-delay: 0.22s; }
  .anim-delay-3   { animation-delay: 0.34s; }
  .anim-delay-4   { animation-delay: 0.46s; }
  .float          { animation: float 4s ease-in-out infinite; }
  .shimmer-text {
    background: linear-gradient(90deg, #2563eb 0%, #7c3aed 40%, #2563eb 80%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
  .card-hover {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -10px rgba(37,99,235,0.18);
  }
  .nav-link {
    position: relative;
    color: #4b5563;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0;
    width: 0; height: 2px;
    background: #2563eb;
    transition: width 0.25s;
    border-radius: 2px;
  }
  .nav-link:hover { color: #2563eb; }
  .nav-link:hover::after { width: 100%; }
  .stat-card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.6);
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  }
  .glow-btn {
    box-shadow: 0 0 0 0 rgba(37,99,235,0.4);
    transition: box-shadow 0.3s ease, transform 0.2s ease;
  }
  .glow-btn:hover {
    box-shadow: 0 0 20px 6px rgba(37,99,235,0.25);
    transform: translateY(-1px);
  }
  .feature-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .divider-gradient {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(37,99,235,0.2), transparent);
  }
`;

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("rentaflux_has_visited", "true");
    navigate("/login");
  };

  const handleDemoClick = () => {
    window.open("", "_blank");
  };

  const handleMobileDownload = (platform: "ios" | "android") => {
    if (platform === "ios") {
      window.open("https://apps.apple.com/search?term=rentaflux", "_blank");
    } else {
      window.open("https://play.google.com/apps/test/com.rentaflux.app/1", "_blank");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get("name") as string) || "";
    const email = (data.get("email") as string) || "";
    const subjectRaw = (data.get("subject") as string) || "Consulta desde RentaFlux";
    const message = (data.get("message") as string) || "";

    try {
      toast({ title: "Enviando...", description: "Por favor espera un momento." });
      const response = await fetch("https://formspree.io/f/mzzjvrre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject: subjectRaw, message, _replyto: email }),
      });
      if (response.ok) {
        toast({ title: "¡Mensaje enviado!", description: "Te responderemos a la brevedad." });
        form.reset();
      } else throw new Error();
    } catch {
      const subject = encodeURIComponent(`${subjectRaw} - ${name}`);
      const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`);
      window.open(`mailto:rentaflux@gmail.com?subject=${subject}&body=${body}`, "_blank");
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="min-h-screen" style={{ background: "#f8faff", color: "#111827" }}>

        {/* ══════════════════════ NAVBAR ══════════════════════ */}
        <header
          style={{
            position: "sticky", top: 0, zIndex: 50,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Building2 style={{ width: 18, height: 18, color: "#fff" }} />
              </div>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.3px" }}>
                RentaFlux
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="nav-link">Características</a>
              <a href="#app" className="nav-link">App Móvil</a>
              <a href="#contacto" className="nav-link">Contacto</a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleLogin}
                style={{ color: "#374151" }}>
                Iniciar Sesión
              </Button>
              <Button size="sm" onClick={handleLogin} className="glow-btn"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  border: "none", color: "#fff", fontWeight: 600,
                }}>
                Empezar gratis
                <ArrowRight style={{ width: 14, height: 14, marginLeft: 6 }} />
              </Button>
            </div>
          </div>
        </header>

        {/* ══════════════════════ HERO ══════════════════════ */}
        <section
          style={{
            paddingTop: "96px", paddingBottom: "80px",
            background: "linear-gradient(160deg, #eff6ff 0%, #f8faff 50%, #faf5ff 100%)",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Decorative blobs */}
          <div style={{
            position: "absolute", top: -120, right: -80,
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -60, left: -60,
            width: 380, height: 380, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div className="container mx-auto px-6 text-center" style={{ position: "relative" }}>
            <div className="anim-fade-up" style={{ marginBottom: 20 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))",
                border: "1px solid rgba(37,99,235,0.2)",
                borderRadius: 100, padding: "6px 14px",
                fontSize: "0.78rem", fontWeight: 600, color: "#2563eb",
              }}>
                <Zap style={{ width: 12, height: 12 }} />
                Disponible en App Store y Google Play
              </span>
            </div>

            <h1 className="anim-fade-up anim-delay-1"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.1,
                marginBottom: 20,
              }}>
              Gestiona tus propiedades<br />
              <span className="shimmer-text">de forma inteligente</span>
            </h1>

            <p className="anim-fade-up anim-delay-2"
              style={{
                fontSize: "1.15rem", color: "#6b7280", maxWidth: 560,
                margin: "0 auto 36px", lineHeight: 1.65,
              }}>
              La plataforma todo-en-uno para propietarios e inquilinos.
              Pagos, mantenimiento, IA y reportes — desde tu móvil o web.
            </p>

            <div className="anim-fade-up anim-delay-3"
              style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
              <Button size="lg" onClick={handleLogin} className="glow-btn"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  border: "none", color: "#fff", fontWeight: 700,
                  padding: "14px 28px", fontSize: "1rem",
                }}>
                Comenzar gratis
                <ArrowRight style={{ width: 16, height: 16, marginLeft: 8 }} />
              </Button>
              <Button size="lg" variant="outline" onClick={handleDemoClick}
                style={{ padding: "14px 28px", fontSize: "1rem", fontWeight: 600 }}>
                Ver demo en vivo
              </Button>
            </div>

            {/* Floating stats cards */}
            <div className="anim-fade-up anim-delay-4"
              style={{
                display: "flex", gap: 14, justifyContent: "center",
                flexWrap: "wrap",
              }}>
              {[
                { icon: <TrendingUp style={{ width: 20, height: 20, color: "#10b981" }} />, label: "Ingresos Mensuales", value: "€12,450", color: "#d1fae5" },
                { icon: <Building2 style={{ width: 20, height: 20, color: "#2563eb" }} />, label: "Ocupación", value: "92%", color: "#dbeafe" },
                { icon: <Users style={{ width: 20, height: 20, color: "#7c3aed" }} />, label: "Inquilinos activos", value: "34", color: "#ede9fe" },
              ].map((s, i) => (
                <div key={i} className="stat-card float"
                  style={{ animationDelay: `${i * 0.4}s`, minWidth: 160 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s.icon}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{s.label}</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827" }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════ SOCIAL PROOF BAR ══════════════════════ */}
        <div style={{
          background: "#fff",
          borderTop: "1px solid rgba(0,0,0,0.05)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          padding: "18px 0",
        }}>
          <div className="container mx-auto px-6"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { icon: <Shield style={{ width: 16, height: 16, color: "#2563eb" }} />, text: "Datos cifrados end-to-end" },
              { icon: <CheckCircle2 style={{ width: 16, height: 16, color: "#10b981" }} />, text: "Sin tarjeta de crédito" },
              { icon: <Star style={{ width: 16, height: 16, color: "#f59e0b" }} />, text: "IA integrada con Cerebras" },
              { icon: <Smartphone style={{ width: 16, height: 16, color: "#7c3aed" }} />, text: "iOS & Android" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {item.icon}
                <span style={{ fontSize: "0.82rem", color: "#6b7280", fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════ FEATURES ══════════════════════ */}
        <section id="features" style={{ padding: "96px 0", background: "#fff" }}>
          <div className="container mx-auto px-6">
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{
                display: "inline-block", marginBottom: 12,
                background: "rgba(37,99,235,0.08)", color: "#2563eb",
                padding: "4px 14px", borderRadius: 100, fontSize: "0.8rem", fontWeight: 600,
              }}>
                Características
              </span>
              <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 12 }}>
                Todo lo que necesitas en un solo sitio
              </h2>
              <p style={{ color: "#6b7280", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
                Gestión completa de propiedades, inquilinos, mantenimiento y finanzas
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
            }}>
              {[
                {
                  icon: <Building2 style={{ width: 24, height: 24, color: "#2563eb" }} />,
                  iconBg: "#dbeafe",
                  title: "Gestión de Propiedades",
                  desc: "Organiza propiedades con múltiples unidades e inquilinos en un solo lugar centralizado.",
                  tag: "Core",
                },
                {
                  icon: <Users style={{ width: 24, height: 24, color: "#10b981" }} />,
                  iconBg: "#d1fae5",
                  title: "Gestión de Inquilinos",
                  desc: "Administra contratos, historial de pagos y comunicación con cada inquilino.",
                  tag: "Core",
                },
                {
                  icon: <ClipboardList style={{ width: 24, height: 24, color: "#8b5cf6" }} />,
                  iconBg: "#ede9fe",
                  title: "Registro de Pagos",
                  desc: "Control claro de todos los pagos recibidos y pendientes. Alertas automáticas.",
                  tag: "Finanzas",
                },
                {
                  icon: <Wrench style={{ width: 24, height: 24, color: "#f59e0b" }} />,
                  iconBg: "#fef3c7",
                  title: "Mantenimiento",
                  desc: "Gestiona solicitudes de mantenimiento, asigna proveedores y sigue el estado.",
                  tag: "Operaciones",
                },
                {
                  icon: <MessageCircle style={{ width: 24, height: 24, color: "#ec4899" }} />,
                  iconBg: "#fce7f3",
                  title: "Asistente IA",
                  desc: "Consulta tus datos con lenguaje natural. Powered by Cerebras AI.",
                  tag: "IA",
                },
                {
                  icon: <BarChart3 style={{ width: 24, height: 24, color: "#0ea5e9" }} />,
                  iconBg: "#e0f2fe",
                  title: "Reportes y Analytics",
                  desc: "Análisis de rentabilidad, exportación PDF/Excel y visualizaciones en tiempo real.",
                  tag: "Analíticas",
                },
              ].map((f, i) => (
                <div key={i} className="card-hover"
                  style={{
                    background: "#fafbff",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: 18,
                    padding: "28px 24px",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                  {/* Top accent line */}
                  <div style={{
                    position: "absolute", top: 0, left: 24, right: 24,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${f.iconBg}, transparent)`,
                    borderRadius: "0 0 2px 2px",
                  }} />

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                    <div className="feature-icon" style={{ background: f.iconBg }}>
                      {f.icon}
                    </div>
                    <span style={{
                      marginLeft: "auto",
                      background: f.iconBg, color: f.icon.props.style.color,
                      padding: "2px 10px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 600,
                    }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 8, color: "#111827" }}>
                    {f.title}
                  </h3>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider-gradient" />

        {/* ══════════════════════ MOBILE APPS ══════════════════════ */}
        <section id="app"
          style={{
            padding: "96px 0",
            background: "linear-gradient(160deg, #1e1b4b 0%, #1e3a8a 50%, #312e81 100%)",
            color: "#fff",
          }}>
          <div className="container mx-auto px-6">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
              className="flex-col md:grid">
              <div>
                <span style={{
                  display: "inline-block", marginBottom: 16,
                  background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)",
                  padding: "4px 14px", borderRadius: 100, fontSize: "0.8rem", fontWeight: 600,
                }}>
                  Aplicaciones móviles en desarrollo
                </span>
                <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 16, lineHeight: 1.2 }}>
                  Gestiona desde cualquier lugar
                </h2>
                <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: 32, maxWidth: 440 }}>
                  Nuestras apps nativas para iOS y Android te dan acceso completo a todas las funciones.
                  Notificaciones, cámara, biometría y más.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    "Notificaciones push de pagos y alertas",
                    "Gestión offline con sincronización automática",
                    "Escáner de documentos integrado",
                    "Touch ID / Face ID",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 style={{ width: 18, height: 18, color: "#34d399", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  {
                    label: "Descargar en",
                    store: "App Store",
                    tag: "Próximamente",
                    bg: "rgba(0,0,0,0.3)",
                    iconBg: "#000",
                    platform: "ios" as const,
                  },
                  {
                    label: "Obtener en",
                    store: "Google Play",
                    tag: "Disponible",
                    bg: "rgba(22,163,74,0.25)",
                    iconBg: "#16a34a",
                    platform: "android" as const,
                  },
                ].map((app, i) => (
                  <button key={i}
                    onClick={() => handleMobileDownload(app.platform)}
                    className="card-hover"
                    style={{
                      background: app.bg,
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 16, padding: "18px 20px",
                      display: "flex", alignItems: "center", gap: 14,
                      cursor: "pointer", textAlign: "left", color: "#fff",
                      transition: "background 0.2s",
                    }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: app.iconBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Smartphone style={{ width: 22, height: 22, color: "#fff" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>{app.label}</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{app.store}</div>
                    </div>
                    <span style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      padding: "3px 10px", borderRadius: 100, fontSize: "0.7rem",
                    }}>
                      {app.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════ CONTACT ══════════════════════ */}
        <section id="contacto" style={{ padding: "96px 0", background: "#f8faff" }}>
          <div className="container mx-auto px-6">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{
                display: "inline-block", marginBottom: 12,
                background: "rgba(37,99,235,0.08)", color: "#2563eb",
                padding: "4px 14px", borderRadius: 100, fontSize: "0.8rem", fontWeight: 600,
              }}>
                Contacto
              </span>
              <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 12 }}>
                ¿Hablamos?
              </h2>
              <p style={{ color: "#6b7280", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
                ¿Tienes preguntas o quieres saber más? Escríbenos y te respondemos rápido.
              </p>
            </div>

            <div style={{ maxWidth: 620, margin: "0 auto" }}>
              <div style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 20,
                padding: "36px 32px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
              }}>
                <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <input type="text" name="hp" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <Label htmlFor="name" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Nombre</Label>
                      <Input id="name" name="name" placeholder="Tu nombre" required
                        style={{ marginTop: 6, borderRadius: 10 }} />
                    </div>
                    <div>
                      <Label htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Email</Label>
                      <Input id="email" name="email" type="email" placeholder="tu@email.com" required
                        style={{ marginTop: 6, borderRadius: 10 }} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Asunto</Label>
                    <Input id="subject" name="subject" placeholder="¿En qué podemos ayudarte?"
                      style={{ marginTop: 6, borderRadius: 10 }} />
                  </div>

                  <div>
                    <Label htmlFor="message" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Mensaje</Label>
                    <Textarea id="message" name="message" placeholder="Cuéntanos más..." rows={4} required
                      style={{ marginTop: 6, borderRadius: 10, resize: "none" }} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <Button type="submit" className="glow-btn"
                      style={{
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        border: "none", color: "#fff", fontWeight: 600,
                        padding: "10px 24px",
                      }}>
                      Enviar mensaje
                      <ArrowRight style={{ width: 15, height: 15, marginLeft: 6 }} />
                    </Button>
                    <a href="mailto:rentaflux@gmail.com"
                      style={{ fontSize: "0.82rem", color: "#2563eb", textDecoration: "none" }}
                      onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}>
                      rentaflux@gmail.com
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════ FOOTER ══════════════════════ */}
        <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "64px 0 32px" }}>
          <div className="container mx-auto px-6">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40 }}
              className="grid-cols-1 md:grid-cols-4">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Building2 style={{ width: 16, height: 16, color: "#fff" }} />
                  </div>
                  <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.1rem" }}>RentaFlux</span>
                </div>
                <p style={{ lineHeight: 1.7, fontSize: "0.88rem", maxWidth: 260 }}>
                  La plataforma todo-en-uno para la gestión de propiedades en alquiler. Moderna, rápida y con IA.
                </p>
              </div>

              <div>
                <h4 style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 16, fontSize: "0.9rem" }}>Producto</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Características", href: "#features" },
                    { label: "App Móvil", href: "#app" },
                    { label: "Demo", onClick: handleDemoClick },
                  ].map((link, i) => (
                    <li key={i}>
                      {link.href ? (
                        <a href={link.href} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.88rem", transition: "color 0.2s" }}
                          onMouseOver={(e) => (e.currentTarget.style.color = "#f1f5f9")}
                          onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}>
                          {link.label}
                        </a>
                      ) : (
                        <button onClick={link.onClick} style={{ background: "none", border: "none", padding: 0, color: "#94a3b8", fontSize: "0.88rem", cursor: "pointer", transition: "color 0.2s" }}
                          onMouseOver={(e) => (e.currentTarget.style.color = "#f1f5f9")}
                          onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}>
                          {link.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 16, fontSize: "0.9rem" }}>Soporte</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <li>
                    <a href="#contacto" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.88rem" }}
                      onMouseOver={(e) => (e.currentTarget.style.color = "#f1f5f9")}
                      onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}>Contacto</a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 16, fontSize: "0.9rem" }}>Legal</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Privacidad", href: "/privacy" },
                    { label: "Términos", href: "/terms" },
                    { label: "Aviso Legal", href: "/legal" },
                    { label: "Cookies", href: "/cookies" },
                    { label: "Accesibilidad", href: "/accessibility" },
                  ].map((link, i) => (
                    <li key={i}>
                      <a href={link.href} style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.88rem" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#f1f5f9")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              marginTop: 48, paddingTop: 24,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 12,
            }}>
              <p style={{ fontSize: "0.82rem" }}>© 2026 RentaFlux. Todos los derechos reservados.</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["🇪🇸 España", "🇺🇸 English"].map((lang, i) => (
                  <span key={i} style={{
                    background: "rgba(255,255,255,0.06)",
                    padding: "3px 10px", borderRadius: 100,
                    fontSize: "0.75rem", color: "#64748b",
                  }}>{lang}</span>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
