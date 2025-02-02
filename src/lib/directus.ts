import { Directus } from '@directus/sdk';

// Schema type for your collections
interface Schema {
  tasks: {
    id: number;
    title: string;
    description: string;
    due_date: string;
    status: string;
  };
  // Add other collection types as needed
}

// Create Directus client instance
export const directus = new Directus<Schema>('http://localhost:8055');

// Helper function to initialize the client
export async function initDirectus() {
  try {
    // You can add authentication logic here if needed
    console.log('Directus client initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Directus client:', error);
    return false;
  }
}

// Example function to fetch items from a collection
export async function fetchItems<T extends keyof Schema>(
  collection: T
): Promise<Schema[T][]> {
  try {
    const response = await directus.items(collection).readByQuery({
      limit: -1,
    });
    return response.data || [];
  } catch (error) {
    console.error(`Failed to fetch ${String(collection)}:`, error);
    return [];
  }
}