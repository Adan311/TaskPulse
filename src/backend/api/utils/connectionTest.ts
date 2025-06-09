import { supabase } from '../../../database/client';

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
