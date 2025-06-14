import { supabase } from "../../backend/database/client";

/**
 * Shared authentication utilities for all backend services
 * Eliminates code duplication across multiple services
 */

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Validate that a user is authenticated and optionally check user ID match
 * @param expectedUserId - Optional user ID to validate against
 * @returns The authenticated user object
 * @throws Error if user is not authenticated or ID doesn't match
 */
export const validateUser = async (expectedUserId?: string): Promise<AuthenticatedUser> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  if (expectedUserId && user.id !== expectedUserId) {
    throw new Error("User ID mismatch");
  }
  
  return {
    id: user.id,
    email: user.email
  };
};

/**
 * Get the current authenticated user without throwing errors
 * @returns The user object or null if not authenticated
 */
export const getCurrentUser = async (): Promise<AuthenticatedUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

/**
 * Check if user is authenticated without throwing errors
 * @returns boolean indicating if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
}; 