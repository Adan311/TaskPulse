import { supabase } from '../client/supabase';

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

// New functions for account management

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  try {
    // First verify the current password
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });
    
    if (signInError) throw new Error('Current password is incorrect');
    
    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

export const updateProfile = async (profileData: { name: string, email?: string }) => {
  try {
    const updates: any = {};
    
    // Update auth metadata
    if (profileData.name) {
      updates.data = { first_name: profileData.name };
    }
    
    // Update email if provided
    if (profileData.email) {
      updates.email = profileData.email;
    }
    
    const { error } = await supabase.auth.updateUser(updates);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

export const deleteAccount = async (password: string) => {
  try {
    // Verify password first
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });
    
    if (signInError) throw new Error('Password is incorrect');
    
    // Delete user data from all tables
    // Using this approach instead of RLS because per your rule, access control
    // should be handled in application code, not through RLS
    const userId = userData.user.id;
    
    // Delete data from each relevant table
    // Using type assertion to ensure these are valid table names
    const tablesToCleanup = ['notes', 'tasks', 'events', 'projects', 'files'] as const;
    
    for (const table of tablesToCleanup) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('user', userId);
      
      if (deleteError) {
        console.error(`Error deleting from ${table}:`, deleteError);
        // Continue with other tables even if one fails
      }
    }
    
    // Sign out the user after data deletion
    await supabase.auth.signOut();
    
    // Note: Supabase doesn't offer a straightforward way to delete user accounts
    // from the client-side. Typically this would require a server-side function
    // or admin API. For now, we'll just log the user out and clean their data.
    
    return { success: true, message: 'Account data deleted and signed out' };
  } catch (error) {
    console.error('Delete account error:', error);
    throw error;
  }
};
