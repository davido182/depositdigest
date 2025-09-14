// RentaFlux Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuración con variables de entorno
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xhscuftwypziepjgnfan.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc2N1ZnR3eXB6aWVwamduZmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTAxMjIsImV4cCI6MjA2Mzc2NjEyMn0.OD4IzuutB5D_Bz6BLeVgxLcpq0UjlVDQMWTXPnq-on8";

// Validación de configuración
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});