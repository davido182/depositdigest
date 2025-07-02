
import { supabase } from "@/integrations/supabase/client";

export class BaseService {
  protected supabase = supabase;

  protected async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
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
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) {
      throw new Error("User not authenticated");
    }
    return user;
  }
}
