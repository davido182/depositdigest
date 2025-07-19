import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secret_key } = await req.json();

    if (!secret_key) {
      return new Response(
        JSON.stringify({ success: false, error: "Secret key is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Stripe with the provided secret key
    const stripe = new Stripe(secret_key, { apiVersion: "2023-10-16" });

    // Test the connection by retrieving account information
    const account = await stripe.accounts.retrieve();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        account: {
          id: account.id,
          email: account.email,
          country: account.country,
          type: account.type
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error testing Stripe connection:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to connect to Stripe" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});