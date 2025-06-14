import { supabase } from '../../../database/client';
import { validateUser, getCurrentUser } from '@/shared/utils/authUtils';

export interface UserConsent {
  id?: string;
  user_id: string;
  cookie_consent: boolean;
  privacy_policy_accepted: boolean;
  terms_accepted: boolean;
  consent_date: string;
  updated_at: string;
}

export const recordCookieConsent = async (accepted: boolean): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error("User not authenticated");
      return false;
    }

    // Check if consent record already exists
    const { data: existingConsent } = await supabase
      .from('user_consent')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingConsent) {
      // Update existing consent
      const { error } = await supabase
        .from('user_consent')
        .update({
          cookie_consent: accepted,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating consent:', error);
        return false;
      }
    } else {
      // Create new consent record
      const { error } = await supabase
        .from('user_consent')
        .insert({
          user_id: user.id,
          cookie_consent: accepted,
          privacy_policy_accepted: false,
          terms_accepted: false
        });

      if (error) {
        console.error('Error creating consent record:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error recording cookie consent:', error);
    return false;
  }
};

export const recordPolicyAcceptance = async (policyType: 'privacy' | 'terms'): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error("User not authenticated");
      return false;
    }

    const updateField = policyType === 'privacy' ? 'privacy_policy_accepted' : 'terms_accepted';

    // Check if consent record exists
    const { data: existingConsent } = await supabase
      .from('user_consent')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingConsent) {
      // Update existing consent
      const { error } = await supabase
        .from('user_consent')
        .update({
          [updateField]: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating policy acceptance:', error);
        return false;
      }
    } else {
      // Create new consent record
      const newConsent = {
        user_id: user.id,
        cookie_consent: false,
        privacy_policy_accepted: policyType === 'privacy',
        terms_accepted: policyType === 'terms'
      };

      const { error } = await supabase
        .from('user_consent')
        .insert(newConsent);

      if (error) {
        console.error('Error creating consent record:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error recording policy acceptance:', error);
    return false;
  }
};

export const getUserConsent = async (): Promise<UserConsent | null> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_consent')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching user consent:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user consent:', error);
    return null;
  }
};

export const hasUserGivenConsent = async (consentType: 'cookie' | 'privacy' | 'terms'): Promise<boolean> => {
  try {
    const consent = await getUserConsent();
    
    if (!consent) return false;

    switch (consentType) {
      case 'cookie':
        return consent.cookie_consent;
      case 'privacy':
        return consent.privacy_policy_accepted;
      case 'terms':
        return consent.terms_accepted;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking user consent:', error);
    return false;
  }
}; 