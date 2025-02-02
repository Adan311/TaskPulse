import { createDirectus, rest, authentication, readMe } from '@directus/sdk';

const directus = createDirectus('http://localhost:8055')
  .with(rest())
  .with(authentication());

export async function login(email: string, password: string) {
  try {
    await directus.login(email, password);
    const user = await readMe(directus);
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(email: string, password: string, name: string) {
  try {
    const response = await directus.request(
      rest.createUser({
        email,
        password,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' '),
      })
    );
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