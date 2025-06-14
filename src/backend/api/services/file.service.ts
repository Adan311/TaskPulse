import { supabase } from "../../database/client";
import { v4 as uuidv4 } from "uuid";
import { validateUser, getCurrentUser } from '@/shared/utils/authUtils';

export interface FileItem {
  id: string;
  name: string;
  file: string;
  type: string;
  size?: number; // in bytes
  user: string;
  project?: string | null;
  task?: string | null;
  event?: string | null;
  uploaded_at?: string;
  updated_at?: string;
}

export interface FileUploadParams {
  file: File;
  name?: string;
  size?: number; // in bytes
  project_id?: string;
  task_id?: string;
  event_id?: string;
}

/**
 * Fetch all files for the authenticated user
 * Optionally filter by project, task, or event
 */
export const fetchFiles = async (options?: {
  project_id?: string;
  task_id?: string;
  event_id?: string;
}): Promise<FileItem[]> => {
  const user = await getCurrentUser();
  
  if (!user) {
    console.log("No authenticated user found when fetching files");
    return [];
  }

  try {
    let query = supabase
      .from("files")
      .select("*")
      .eq("user", user.id);

    // Apply filters if provided
    if (options?.project_id) {
      query = query.eq("project", options.project_id);
    }
    if (options?.task_id) {
      query = query.eq("task", options.task_id);
    }
    if (options?.event_id) {
      query = query.eq("event", options.event_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching files:", error);
      throw error;
    }

    return data as FileItem[];
  } catch (error) {
    console.error("Exception fetching files:", error);
    throw error;
  }
};

/**
 * Get a single file by ID (with user permission check)
 */
export const getFileById = async (fileId: string): Promise<FileItem> => {
  const user = await validateUser();

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user", user.id)
    .single();

  if (error) {
    console.error("Error fetching file:", error);
    throw error;
  }

  if (!data) {
    throw new Error(`File with id ${fileId} not found or you don't have permission to access it`);
  }

  return data as FileItem;
};

/**
 * Upload a file to Supabase Storage and save metadata to the database
 */
export const uploadFile = async (params: FileUploadParams): Promise<FileItem> => {
  const user = await validateUser();

  try {
    const file = params.file;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError);
      throw uploadError;
    }

    // Create file record in database
    const fileId = uuidv4();
    const fileData = {
      id: fileId,
      name: params.name || file.name,
      file: filePath,
      type: file.type,
      size: file.size, // store file size in bytes
      user: user.id,
      project: params.project_id || null,
      task: params.task_id || null,
      event: params.event_id || null,
      uploaded_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('files')
      .insert(fileData)
      .select()
      .single();

    if (error) {
      // Clean up the uploaded file if database insert fails
      await supabase.storage.from('files').remove([filePath]);
      console.error("Error saving file metadata:", error);
      throw error;
    }

    return data as FileItem;
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
};

/**
 * Get a download URL for a file (with user permission check)
 */
export const getFileDownloadUrl = async (fileId: string): Promise<string> => {
  const file = await getFileById(fileId);
  
  const { data } = supabase.storage
    .from('files')
    .getPublicUrl(file.file);

  return data.publicUrl;
};

/**
 * Delete a file (with user permission check)
 * Removes both the storage object and the database record
 */
export const deleteFile = async (fileId: string): Promise<boolean> => {
  const user = await validateUser();

  try {
    // Get the file first to check permissions and get the storage path
    const { data } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("user", user.id)
      .single();

    if (!data) {
      throw new Error("File not found or you don't have permission to delete it");
    }

    // Delete the file from storage
    const file = data as FileItem;
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([file.file]);

    if (storageError) {
      console.error("Error removing file from storage:", storageError);
      // Continue with database deletion even if storage removal fails
    }

    // Delete the database record
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('user', user.id);

    if (dbError) {
      console.error("Error removing file record from database:", dbError);
      throw dbError;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteFile:", error);
    throw error;
  }
};

/**
 * Attach a file to a project/task/event
 */
export const attachFile = async (
  fileId: string, 
  entityType: 'project' | 'task' | 'event',
  entityId: string
): Promise<FileItem> => {
  const user = await validateUser();

  // Verify file belongs to the user
  const { data: fileData } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .eq("user", user.id)
    .single();

  if (!fileData) {
    throw new Error("File not found or you don't have permission to modify it");
  }

  // Prepare update data
  const updateData: Partial<FileItem> = {
    updated_at: new Date().toISOString()
  };

  // Set the appropriate field based on entityType
  if (entityType === 'project') updateData.project = entityId;
  if (entityType === 'task') updateData.task = entityId;
  if (entityType === 'event') updateData.event = entityId;

  // Update the file
  const { data, error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', fileId)
    .eq('user', user.id)
    .select()
    .single();

  if (error) {
    console.error(`Error attaching file to ${entityType}:`, error);
    throw error;
  }

  return data as FileItem;
};

/**
 * Detach a file from a project/task/event
 */
export const detachFile = async (
  fileId: string, 
  entityType: 'project' | 'task' | 'event'
): Promise<FileItem> => {
  const user = await validateUser();

  // Prepare update data
  const updateData: Partial<FileItem> = {
    updated_at: new Date().toISOString()
  };

  // Set the appropriate field to null based on entityType
  if (entityType === 'project') updateData.project = null;
  if (entityType === 'task') updateData.task = null;
  if (entityType === 'event') updateData.event = null;

  // Update the file
  const { data, error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', fileId)
    .eq('user', user.id)
    .select()
    .single();

  if (error) {
    console.error(`Error detaching file from ${entityType}:`, error);
    throw error;
  }

  return data as FileItem;
};

/**
 * Check if a file can be previewed inline
 */
export const canPreviewFile = (fileType: string): boolean => {
  const previewableTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
    // PDFs
    'application/pdf',
    // Text
    'text/plain', 'text/csv',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    // Video
    'video/mp4', 'video/webm', 'video/ogg'
  ];
  
  return previewableTypes.includes(fileType);
}; 