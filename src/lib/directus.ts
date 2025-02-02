import { createDirectus, rest, authentication } from '@directus/sdk';

const directus = createDirectus('http://localhost:8055').with(authentication()).with(rest());

export const initDirectus = async () => {
  try {
    const response = await directus.request(rest.get('server/info'));
    return !!response;
  } catch (error) {
    console.error('Directus initialization error:', error);
    return false;
  }
};

export const fetchItems = async <T extends string>(collection: T) => {
  try {
    const items = await directus.request(rest.readItems(collection));
    return items;
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error);
    return [];
  }
};

export default directus;