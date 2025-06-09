import { supabase } from './client';

/**
 * Test database connection by attempting a simple query
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('tasks').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
};

/**
 * Test Supabase connection using the utility function from client
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('tasks').select('count').limit(1);
    return !error;
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return false;
  }
}; 