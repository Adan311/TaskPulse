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
} from '../../../src/backend/api/services/notes.service';

// Mock the Supabase client
vi.mock('../../../src/integrations/supabase/client', () => {
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
    const { supabase } = await import('../../../src/integrations/supabase/client');
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

    it('should handle database errors', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      await expect(getUserNotes()).rejects.toThrow();
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

    it('should return null when note not found', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await getNoteById('nonexistent-note');

      expect(result).toBeNull();
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
      // Mock the select query to get current pinned status
      const mockSelectChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { pinned: false }, error: null })
            })
          })
        })
      };

      // Mock the update query
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

    it('should filter by project name in application layer', async () => {
      const notesWithDifferentProjects = [
        { ...mockNoteWithProject, project_data: { id: '1', name: 'Test Project', color: '#ff0000' } },
        { ...mockNoteWithProject, project_data: { id: '2', name: 'Other Project', color: '#00ff00' } }
      ];

      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: notesWithDifferentProjects, error: null })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await fetchNotesWithProjects(undefined, 'test', false);

      // Should only return notes with project name containing 'test'
      expect(result).toHaveLength(1);
      expect(result[0].project_data?.name).toBe('Test Project');
    });
  });

  // Enhanced Tests for Advanced Features
  describe('Enhanced Notes Features', () => {
    it('should handle bulk note operations', async () => {
      // Test creating multiple notes
      const noteData1: CreateNoteData = { content: 'Note 1', project: 'project-1' };
      const noteData2: CreateNoteData = { content: 'Note 2', project: 'project-2' };

      const mockQueryChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNote, error: null })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const note1 = await createNote(noteData1);
      const note2 = await createNote(noteData2);

      expect(note1).toEqual(mockNote);
      expect(note2).toEqual(mockNote);
      expect(mockQueryChain.insert).toHaveBeenCalledTimes(2);
    });

    it('should handle note content with special characters', async () => {
      const specialContent = 'Note with "quotes", <tags>, & symbols!';
      const noteData: CreateNoteData = { content: specialContent };

      const mockQueryChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { ...mockNote, content: specialContent }, error: null })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await createNote(noteData);

      expect(result.content).toBe(specialContent);
    });

    it('should handle empty search results gracefully', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await searchNotes('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle notes without projects', async () => {
      const noteWithoutProject = { ...mockNote, project: null, project_data: null };

      const mockQueryChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [noteWithoutProject], error: null })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await getUserNotes();

      expect(result[0].project).toBeNull();
      expect(result[0].project_data).toBeNull();
    });

    it('should handle concurrent note operations', async () => {
      const mockQueryChain = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockNote, error: null })
              })
            })
          })
        })
      };

      mockSupabase.from.mockReturnValue(mockQueryChain);

      // Simulate concurrent updates
      const updates1 = { content: 'Updated content 1' };
      const updates2 = { content: 'Updated content 2' };

      const [result1, result2] = await Promise.all([
        updateNote('note-123', updates1),
        updateNote('note-456', updates2)
      ]);

      expect(result1).toEqual(mockNote);
      expect(result2).toEqual(mockNote);
      expect(mockQueryChain.update).toHaveBeenCalledTimes(2);
    });
  });
}); 