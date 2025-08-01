import { supabase } from '../../database/client';

export interface SupportContact {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
  admin_notes?: string;
}

/**
 * Submit a new support contact form

 */
export async function submitSupportContact(contactData: Omit<SupportContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Validate required fields
    if (!contactData.name?.trim()) {
      throw new Error('Name is required');
    }
    if (!contactData.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!contactData.subject?.trim()) {
      throw new Error('Subject is required');
    }
    if (!contactData.message?.trim()) {
      throw new Error('Message is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Create support contact record
    const supportContact: Omit<SupportContact, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      name: contactData.name.trim(),
      email: contactData.email.trim().toLowerCase(),
      subject: contactData.subject.trim(),
      message: contactData.message.trim(),
      status: 'open',
      priority: 'normal'
    };

    const { data, error } = await supabase
      .from('support_contacts')
      .insert(supportContact)
      .select('*')
      .single();

    if (error) {
      console.error('Error submitting support contact:', error);
      throw new Error('Failed to submit support request. Please try again.');
    }

    console.log('Support contact submitted successfully:', data.id);
    return data;

  } catch (error) {
    console.error('Error in submitSupportContact:', error);
    throw error;
  }
}

/**
 * Get user's support contacts

 */
export async function getUserSupportContacts(limit: number = 10, offset: number = 0) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('support_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user support contacts:', error);
      throw new Error('Failed to fetch support contacts');
    }

    return data || [];

  } catch (error) {
    console.error('Error in getUserSupportContacts:', error);
    throw error;
  }
}

/**
 * Get a specific support contact by ID
 */
export async function getSupportContactById(contactId: string) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    const { data, error } = await supabase
      .from('support_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', user.id) // Ensure user owns this contact
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Support contact not found');
      }
      console.error('Error fetching support contact:', error);
      throw new Error('Failed to fetch support contact');
    }

    return data;

  } catch (error) {
    console.error('Error in getSupportContactById:', error);
    throw error;
  }
}

/**
 * Update a support contact (for additional information)

 */
export async function updateSupportContact(contactId: string, updates: Partial<Pick<SupportContact, 'message' | 'priority'>>) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    // Only allow users to update certain fields
    const allowedUpdates: Partial<SupportContact> = {};
    if (updates.message) {
      allowedUpdates.message = updates.message.trim();
    }
    if (updates.priority) {
      allowedUpdates.priority = updates.priority;
    }

    const { data, error } = await supabase
      .from('support_contacts')
      .update(allowedUpdates)
      .eq('id', contactId)
      .eq('user_id', user.id) // Ensure user owns this contact
      .select('*')
      .single();

    if (error) {
      console.error('Error updating support contact:', error);
      throw new Error('Failed to update support contact');
    }

    return data;

  } catch (error) {
    console.error('Error in updateSupportContact:', error);
    throw error;
  }
}

/**
 * Get support contact statistics for user
 */
export async function getSupportContactStats() {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('support_contacts')
      .select('status, priority')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching support contact stats:', error);
      throw new Error('Failed to fetch support statistics');
    }

    const stats = {
      total: data.length,
      byStatus: {
        open: data.filter(c => c.status === 'open').length,
        in_progress: data.filter(c => c.status === 'in_progress').length,
        resolved: data.filter(c => c.status === 'resolved').length,
        closed: data.filter(c => c.status === 'closed').length,
      },
      byPriority: {
        low: data.filter(c => c.priority === 'low').length,
        normal: data.filter(c => c.priority === 'normal').length,
        high: data.filter(c => c.priority === 'high').length,
        urgent: data.filter(c => c.priority === 'urgent').length,
      }
    };

    return stats;

  } catch (error) {
    console.error('Error in getSupportContactStats:', error);
    throw error;
  }
}
