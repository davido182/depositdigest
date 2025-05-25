
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

export class SupabaseService {
  protected getCurrentUser(): User | null {
    const { data: { user } } = supabase.auth.getUser();
    return user;
  }

  protected getUserId(): string {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    return user.id;
  }

  protected async ensureAuthenticated() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error("User not authenticated");
    }
    return user;
  }
}
