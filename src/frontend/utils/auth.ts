import { supabase } from "@/backend/database/client";
import { useToast } from '@/frontend/hooks/use-toast';

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

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const setupAuthListener = (callback: (user: any) => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  return data.subscription;
};
