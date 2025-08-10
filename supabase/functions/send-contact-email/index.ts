
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  hp?: string; // honeypot
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body: ContactPayload = await req.json();
    console.log("send-contact-email received body:", body && { ...body, message: `[len:${body?.message?.length}]` });

    // Simple anti-spam honeypot
    if (body.hp) {
      console.warn("Honeypot triggered, discarding request.");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const subjectRaw = (body.subject || "Consulta").trim();
    const message = (body.message || "").trim();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Email inválido." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (message.length < 10) {
      return new Response(JSON.stringify({ error: "El mensaje es demasiado corto." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const subject = `[Contacto RentaFlux] ${subjectRaw} — ${name}`;
    const to = "rentaflux@gmail.com";

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subjectRaw}</p>
        <hr />
        <p style="white-space:pre-wrap">${message.replace(/</g, "&lt;")}</p>
        <hr />
        <p style="font-size:12px;color:#666">Enviado desde el formulario de RentaFlux</p>
      </div>
    `;
    const text = `Nuevo mensaje de contacto
Nombre: ${name}
Email: ${email}
Asunto: ${subjectRaw}

${message}`;

    const emailResponse = await resend.emails.send({
      from: "RentaFlux <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      text,
      reply_to: email,
    });

    console.log("Resend email sent:", emailResponse);

    return new Response(JSON.stringify({ ok: true, id: (emailResponse as any)?.id || null }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-contact-email error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Error interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
