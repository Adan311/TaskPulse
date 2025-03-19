
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';

export const login = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (email: string, password: string, name: string) => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: name,
        }
      }
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};
