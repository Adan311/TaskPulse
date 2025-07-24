import { supabase } from "../../database/client";
import { v4 as uuidv4 } from "uuid";
import { validateUser } from '@/shared/utils/authUtils';

// Types for Notes based on actual database schema
export interface Note {
  id: string;
  content: string | null;
  last_updated: string | null;
  user: string | null;
  project: string | null;
  pinned: boolean | null;
}

export interface NoteWithProject extends Note {
  project_data?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export interface CreateNoteData {
  content: string;
  project?: string | null;
  pinned?: boolean;
}

export interface UpdateNoteData {
  content?: string;
  project?: string | null;
  pinned?: boolean;
}

/**
 * Get all notes for the authenticated user
 */
export async function getUserNotes(): Promise<NoteWithProject[]> {
  const user = await validateUser();

  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      project_data:projects(id, name, color)
    `)
    .eq('user', user.id)
    .order('last_updated', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a specific note by ID
 */
export async function getNoteById(noteId: string): Promise<NoteWithProject | null> {
  const user = await validateUser();

  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      project_data:projects(id, name, color)
    `)
    .eq('id', noteId)
    .eq('user', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

/**
 * Create a new note
 */
export async function createNote(noteData: CreateNoteData): Promise<Note> {
  const user = await validateUser();

  const newNote = {
    id: uuidv4(),
    content: noteData.content,
    user: user.id,
    project: noteData.project || null,
    pinned: noteData.pinned || false,
    last_updated: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("notes")
    .insert(newNote)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing note
 */
export async function updateNote(noteId: string, updates: UpdateNoteData): Promise<Note> {
  const user = await validateUser();

  const updateData = {
    ...updates,
    last_updated: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("notes")
    .update(updateData)
    .eq('id', noteId)
    .eq('user', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  const user = await validateUser();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq('id', noteId)
    .eq('user', user.id);

  if (error) throw error;
}

/**
 * Get notes by project
 */
export async function getNotesByProject(projectId: string): Promise<Note[]> {
  const user = await validateUser();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq('user', user.id)
    .eq('project', projectId)
    .order('last_updated', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get pinned notes
 */
export async function getPinnedNotes(): Promise<NoteWithProject[]> {
  const user = await validateUser();

  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      project_data:projects(id, name, color)
    `)
    .eq('user', user.id)
    .eq('pinned', true)
    .order('last_updated', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Toggle note pinned status
 */
export async function toggleNotePinned(noteId: string): Promise<Note> {
  const user = await validateUser();

  // First get the current pinned status
  const { data: currentNote, error: fetchError } = await supabase
    .from("notes")
    .select("pinned")
    .eq('id', noteId)
    .eq('user', user.id)
    .single();

  if (fetchError) throw fetchError;

  // Toggle the pinned status
  const { data, error } = await supabase
    .from("notes")
    .update({ 
      pinned: !currentNote.pinned,
      last_updated: new Date().toISOString()
    })
    .eq('id', noteId)
    .eq('user', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Search notes by content
 */
export async function searchNotes(searchTerm: string): Promise<NoteWithProject[]> {
  const user = await validateUser();

  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      project_data:projects(id, name, color)
    `)
    .eq('user', user.id)
    .ilike('content', `%${searchTerm}%`)
    .order('last_updated', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch notes with project information and advanced filtering
 */
export async function fetchNotesWithProjects(
  contentSearch?: string,
  projectName?: string,
  pinnedOnly?: boolean
): Promise<NoteWithProject[]> {
  const user = await validateUser();

  let query = supabase
    .from('notes')
    .select(`
      *,
      project_data:projects(id, name, color)
    `)
    .eq('user', user.id);

  // Filter by content if provided
  if (contentSearch && contentSearch.trim() !== '') {
    query = query.ilike('content', `%${contentSearch}%`);
  }

  // Filter by pinned status if requested
  if (pinnedOnly === true) {
    query = query.eq('pinned', true);
  }

  const { data: notes, error } = await query.order('last_updated', { ascending: false });

  if (error) throw error;

  let filteredNotes = notes || [];

  // Filter by project name if provided (done in application layer for flexibility)
  if (projectName && projectName.trim() !== '') {
    const lowercaseProjectName = projectName.toLowerCase();
    filteredNotes = filteredNotes.filter(note => 
      note.project_data && 
      note.project_data.name && 
      note.project_data.name.toLowerCase().includes(lowercaseProjectName)
    );
  }

  return filteredNotes;
} 