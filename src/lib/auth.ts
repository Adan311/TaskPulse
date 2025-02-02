import { createDirectus, rest, authentication } from '@directus/sdk';
import { toast } from '@/components/ui/use-toast';

const directus = createDirectus('http://localhost:8055').with(authentication()).with(rest());

export const login = async (email: string, password: string) => {
  try {
    await directus.login(email, password);
    return true;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (email: string, password: string, name: string) => {
  try {
    await directus.request(rest.createItem('users', {
      email,
      password,
      first_name: name,
      role: '1' // Public role ID - make sure this matches your Directus setup
    }));
    return true;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await directus.logout();
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};