import { useState, useRef, useEffect } from "react";
import { useToast } from "@/frontend/hooks/use-toast";
import { getCurrentUser } from "@/shared/utils/authUtils";
import * as notesService from "@/backend/api/services/notes.service";
import * as projectService from "@/backend/api/services/project.service";

// --- Hook returns all relevant state and functions to manage notes
export function useNotes() {
  const [notes, setNotes] = useState<notesService.NoteWithProject[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          await Promise.all([
            loadNotes(),
            loadProjects()
          ]);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadProjects = async () => {
    try {
      const projectsData = await projectService.fetchProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const loadNotes = async () => {
    try {
      const notesData = await notesService.getUserNotes();
      setNotes(notesData);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const addNote = async (newNote: string) => {
    if (!newNote.trim() || !user) return;
    try {
      setLoading(true);
      const noteData: notesService.CreateNoteData = {
        content: newNote,
        project: selectedProject === 'all' ? null : selectedProject,
        pinned: false
      };
      
      const createdNote = await notesService.createNote(noteData);
      
      // Add project data for consistency with getUserNotes format
      const noteWithProject: notesService.NoteWithProject = {
        ...createdNote,
        project_data: selectedProject !== 'all' && selectedProject ? 
          projects.find(p => p.id === selectedProject) : null
      };
      
      setNotes([noteWithProject, ...notes]);
      toast({
        title: "Success!",
        description: "Your note has been added.",
      });
      return true;
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add your note. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await notesService.deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
      toast({
        title: "Success!",
        description: "Your note has been deleted.",
      });
      return true;
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete your note. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const pinNote = async (id: string) => {
    try {
      const updatedNote = await notesService.updateNote(id, { pinned: true });
      setNotes(notes => notes.map(note => 
        note.id === id ? { ...note, pinned: true, last_updated: updatedNote.last_updated } : note
      ));
      toast({ title: "Pinned!", description: "Note pinned to top." });
    } catch (error) {
      console.error("Error pinning note:", error);
      toast({ title: "Error", description: "Failed to pin note.", variant: "destructive" });
    }
  };

  const unpinNote = async (id: string) => {
    try {
      const updatedNote = await notesService.updateNote(id, { pinned: false });
      setNotes(notes => notes.map(note => 
        note.id === id ? { ...note, pinned: false, last_updated: updatedNote.last_updated } : note
      ));
      toast({ title: "Unpinned!", description: "Note unpinned." });
    } catch (error) {
      console.error("Error unpinning note:", error);
      toast({ title: "Error", description: "Failed to unpin note.", variant: "destructive" });
    }
  };

  const startEdit = (note: any) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setTimeout(() => {
      if (editInputRef.current) editInputRef.current.focus();
    }, 10);
  };

  const saveEdit = async () => {
    if (!editContent.trim() || !editingId) return false;
    try {
      const updatedNote = await notesService.updateNote(editingId, { content: editContent });
      setNotes(notes.map(note => note.id === editingId
        ? { ...note, content: updatedNote.content, last_updated: updatedNote.last_updated }
        : note
      ));
      setEditingId(null);
      toast({
        title: "Success!",
        description: "Your note has been updated.",
      });
      return true;
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update your note. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelEdit = () => setEditingId(null);
  
  const addNoteToProject = async (noteId: string, projectId: string) => {
    try {
      const updatedNote = await notesService.updateNote(noteId, { project: projectId });
      
      // Update local state with project data
      const projectData = projects.find(p => p.id === projectId);
      setNotes(notes.map(note => 
        note.id === noteId 
          ? { 
              ...note, 
              project: projectId, 
              last_updated: updatedNote.last_updated,
              project_data: projectData || null
            }
          : note
      ));
      
      toast({
        title: "Success!",
        description: "Note added to project.",
      });
      
      return true;
    } catch (error) {
      console.error("Error adding note to project:", error);
      toast({
        title: "Error",
        description: "Failed to add note to project. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Unlink a note from a project
  const unlinkNoteFromProject = async (noteId: string) => {
    try {
      const updatedNote = await notesService.updateNote(noteId, { project: null });
      
      // Update local state
      setNotes(notes.map(note => 
        note.id === noteId 
          ? { 
              ...note, 
              project: null, 
              last_updated: updatedNote.last_updated,
              project_data: null
            }
          : note
      ));
      
      toast({
        title: "Success!",
        description: "Note removed from project.",
      });
      
      return true;
    } catch (error) {
      console.error("Error removing note from project:", error);
      toast({
        title: "Error",
        description: "Failed to remove note from project. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Refresh notes - renamed from fetchNotes for consistency
  const refreshNotes = async () => {
    await loadNotes();
  };

  return {
    notes,
    projects,
    user,
    selectedProject,
    setSelectedProject,
    loading,
    addNote,
    deleteNote,
    editingId,
    editContent,
    setEditContent,
    editInputRef,
    startEdit,
    saveEdit,
    cancelEdit,
    fetchNotes: refreshNotes, // Keep the old name for compatibility
    setNotes,
    pinNote,
    unpinNote,
    addNoteToProject,
    unlinkNoteFromProject,
    refreshNotes,
    loadNotes,
    loadProjects,
  };
}
