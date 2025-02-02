import { createDirectus, rest, readItems } from '@directus/sdk';

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

// Create Directus client instance with the correct SDK syntax
export const directus = createDirectus<Schema>('http://localhost:8055').with(rest());

// Helper function to initialize the client
export async function initDirectus() {
  try {
    // Test the connection by attempting to read items
    await readItems(directus, 'tasks', {
      limit: 1
    });
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
    const response = await readItems(directus, collection, {
      limit: -1,
    });
    return response || [];
  } catch (error) {
    console.error(`Failed to fetch ${String(collection)}:`, error);
    return [];
  }
}