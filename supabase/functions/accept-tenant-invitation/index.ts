
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { invitation_code } = await req.json();
    if (!invitation_code) throw new Error("Invitation code is required");

    // Find and validate invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('tenant_invitations')
      .select('*')
      .eq('invitation_code', invitation_code)
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      throw new Error("Invalid or expired invitation code");
    }

    // Mark invitation as used
    await supabaseClient
      .from('tenant_invitations')
      .update({
        used_by: user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    // Create tenant role
    await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'tenant',
        landlord_id: invitation.landlord_id,
        unit_code: invitation.unit_number,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,role' });

    return new Response(JSON.stringify({
      success: true,
      unit_number: invitation.unit_number,
      landlord_id: invitation.landlord_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
