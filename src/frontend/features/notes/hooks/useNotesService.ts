import { useState, useEffect } from 'react';
import { 
  getUserNotes, 
  createNote, 
  updateNote, 
  deleteNote, 
  toggleNotePinned,
  searchNotes,
  getPinnedNotes,
  getNotesByProject,
  type Note,
  type NoteWithProject,
  type CreateNoteData,
  type UpdateNoteData
} from '@/backend/api/services/notes.service';

export interface UseNotesServiceReturn {
  notes: NoteWithProject[];
  loading: boolean;
  error: string | null;
  createNote: (noteData: CreateNoteData) => Promise<Note>;
  updateNote: (noteId: string, updates: UpdateNoteData) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  togglePinned: (noteId: string) => Promise<Note>;
  searchNotes: (searchTerm: string) => Promise<NoteWithProject[]>;
  getPinnedNotes: () => Promise<NoteWithProject[]>;
  getNotesByProject: (projectId: string) => Promise<Note[]>;
  refreshNotes: () => Promise<void>;
}

/**
 * Hook for managing notes using the backend service
 * Follows the MCP pattern used by other features
 */
export function useNotesService(): UseNotesServiceReturn {
  const [notes, setNotes] = useState<NoteWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotes = await getUserNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (noteData: CreateNoteData): Promise<Note> => {
    try {
      setError(null);
      const newNote = await createNote(noteData);
      await loadNotes(); // Refresh the list
      return newNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleUpdateNote = async (noteId: string, updates: UpdateNoteData): Promise<Note> => {
    try {
      setError(null);
      const updatedNote = await updateNote(noteId, updates);
      await loadNotes(); // Refresh the list
      return updatedNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleDeleteNote = async (noteId: string): Promise<void> => {
    try {
      setError(null);
      await deleteNote(noteId);
      await loadNotes(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleTogglePinned = async (noteId: string): Promise<Note> => {
    try {
      setError(null);
      const updatedNote = await toggleNotePinned(noteId);
      await loadNotes(); // Refresh the list
      return updatedNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle pin status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleSearchNotes = async (searchTerm: string): Promise<NoteWithProject[]> => {
    try {
      setError(null);
      return await searchNotes(searchTerm);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search notes';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleGetPinnedNotes = async (): Promise<NoteWithProject[]> => {
    try {
      setError(null);
      return await getPinnedNotes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pinned notes';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleGetNotesByProject = async (projectId: string): Promise<Note[]> => {
    try {
      setError(null);
      return await getNotesByProject(projectId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get notes by project';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    notes,
    loading,
    error,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
    togglePinned: handleTogglePinned,
    searchNotes: handleSearchNotes,
    getPinnedNotes: handleGetPinnedNotes,
    getNotesByProject: handleGetNotesByProject,
    refreshNotes: loadNotes,
  };
} 