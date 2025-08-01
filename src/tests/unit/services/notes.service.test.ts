import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getUserNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getNotesByProject,
  getPinnedNotes,
  toggleNotePinned,
  searchNotes,
  fetchNotesWithProjects,
  type CreateNoteData,
  type UpdateNoteData
} from '../../../backend/api/services/notes.service';


vi.mock('../../../backend/database/client', () => {
  const mockAuth = {
    getUser: vi.fn()
  };

  return {
    supabase: {
      auth: mockAuth,
      from: vi.fn()
    }
  };
});

// Mock UUID
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123')
}));

describe('Notes Service', () => {
  let mockSupabase: any;
  
  const mockUser = { id: 'user-123' };
  const mockNote = {
    id: 'note-123',
    content: 'Test note content',
    last_updated: '2024-01-01T00:00:00Z',
    user: 'user-123',
    project: 'project-123',
    pinned: false
  };

  const mockNoteWithProject = {
    ...mockNote,
    project_data: {
      id: 'project-123',
      name: 'Test Project',
      color: '#ff0000'
    }
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked supabase instance
    const { supabase } = await import('../../../backend/database/client');
    mockSupabase = supabase;
    
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    
    // Ensure auth mock is reset to authenticated state after each test
    // This prevents test pollution from unauthenticated user tests
    if (mockSupabase?.auth?.getUser) {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    }
  });

  describe('getUserNotes', () => {
    it('should fetch all notes for authenticated user', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockNoteWithProject], error: null })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await getUserNotes();

      expect(mockSupabase.from).toHaveBeenCalledWith('notes');
      expect(mockQueryChain.select).toHaveBeenCalledWith(`
      *,
      project_data:projects(id, name, color)
    `);
      expect(result).toEqual([mockNoteWithProject]);
    });

    it('should throw error when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(getUserNotes()).rejects.toThrow('User not authenticated');
    });


  });

  describe('getNoteById', () => {
    it('should fetch a specific note by ID', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockNoteWithProject, error: null })
            })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await getNoteById('note-123');

      expect(result).toEqual(mockNoteWithProject);
    });


  });

  describe('createNote', () => {
    it('should create a new note', async () => {
      const noteData: CreateNoteData = {
        content: 'New note content',
        project: 'project-123',
        pinned: false
      };

      const mockQueryChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNote, error: null })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await createNote(noteData);

      expect(mockSupabase.from).toHaveBeenCalledWith('notes');
      expect(mockQueryChain.insert).toHaveBeenCalledWith({
        id: 'mock-uuid-123',
        content: 'New note content',
        user: 'user-123',
        project: 'project-123',
        pinned: false,
        last_updated: expect.any(String)
      });
      expect(result).toEqual(mockNote);
    });

    it('should handle creation errors', async () => {
      const noteData: CreateNoteData = {
        content: 'New note content'
      };

      const mockQueryChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Creation failed' } })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      await expect(createNote(noteData)).rejects.toThrow();
    });
  });

  describe('updateNote', () => {
    it('should update an existing note', async () => {
      const updates: UpdateNoteData = {
        content: 'Updated content',
        pinned: true
      };

      const updatedNote = { ...mockNote, ...updates };

      const mockQueryChain = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedNote, error: null })
              })
            })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await updateNote('note-123', updates);

      expect(mockQueryChain.update).toHaveBeenCalledWith({
        ...updates,
        last_updated: expect.any(String)
      });
      expect(result).toEqual(updatedNote);
    });
  });

  describe('deleteNote', () => {
    it('should delete a note', async () => {
      const mockQueryChain = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      await deleteNote('note-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('notes');
      expect(mockQueryChain.delete).toHaveBeenCalled();
    });
  });

  describe('getNotesByProject', () => {
    it('should fetch notes for a specific project', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [mockNote], error: null })
            })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await getNotesByProject('project-123');

      expect(result).toEqual([mockNote]);
    });
  });

  describe('getPinnedNotes', () => {
    it('should fetch only pinned notes', async () => {
      const pinnedNote = { ...mockNoteWithProject, pinned: true };

      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [pinnedNote], error: null })
            })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await getPinnedNotes();

      expect(result).toEqual([pinnedNote]);
    });
  });

  describe('toggleNotePinned', () => {
    it('should toggle note pinned status', async () => {

      const mockSelectChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { pinned: false }, error: null })
            })
          })
        })
      };


      const mockUpdateChain = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { ...mockNote, pinned: true }, error: null })
              })
            })
          })
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectChain)  // First call for getting current status
        .mockReturnValueOnce(mockUpdateChain); // Second call for updating

      const result = await toggleNotePinned('note-123');

      expect(mockUpdateChain.update).toHaveBeenCalledWith({
        pinned: true,
        last_updated: expect.any(String)
      });
      expect(result.pinned).toBe(true);
    });
  });

  describe('searchNotes', () => {
    it('should search notes by content', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockNoteWithProject], error: null })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await searchNotes('test');

      expect(mockQueryChain.ilike).toHaveBeenCalledWith('content', '%test%');
      expect(result).toEqual([mockNoteWithProject]);
    });
  });

  describe('fetchNotesWithProjects', () => {
    it('should fetch notes with project information and filters', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockNoteWithProject], error: null })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await fetchNotesWithProjects('test content', 'Test Project', true);

      expect(mockQueryChain.ilike).toHaveBeenCalledWith('content', '%test content%');
      expect(mockQueryChain.eq).toHaveBeenCalledWith('pinned', true);
      expect(result).toEqual([mockNoteWithProject]);
    });


  });


}); 