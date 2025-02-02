import { createDirectus, rest, authentication, readMe } from '@directus/sdk';

const directus = createDirectus('http://localhost:8055')
  .with(rest())
  .with(authentication());

export async function login(email: string, password: string) {
  try {
    await directus.login(email, password);
    const user = await directus.request(readMe());
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(email: string, password: string, name: string) {
  try {
    // Using the correct method to create a user in Directus
    const response = await directus.request(rest.create('users', {
      email,
      password,
      first_name: name.split(' ')[0],
      last_name: name.split(' ').slice(1).join(' '),
      role: '3f0a1465-c424-4a9d-a694-21c06b5656a2' // Make sure to replace this with your actual Public role ID from Directus
    }));
    
    return { success: true, user: response };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await directus.logout();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}