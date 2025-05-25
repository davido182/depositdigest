
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

export class SupabaseService {
  protected async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  protected async getUserId(): Promise<string> {
    const user = await this.getCurrentUser();
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
