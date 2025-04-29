import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/frontend/hooks/use-toast";

// --- Hook returns all relevant state and functions to manage notes
export function useNotes() {
  const [notes, setNotes] = useState<any[]>([]);
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
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        fetchNotes(data.user.id);
        fetchProjects(data.user.id);
      } else {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const fetchProjects = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('projects').select('*').eq('user', userId);
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchNotes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user', userId)
        .order('pinned', { ascending: false })
        .order('last_updated', { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (newNote: string) => {
    if (!newNote.trim() || !user) return;
    try {
      setLoading(true);
      const newNoteData = {
        id: uuidv4(),
        content: newNote,
        user: user.id,
        project: selectedProject === 'all' ? null : selectedProject,
        last_updated: new Date().toISOString(),
        pinned: false
      };
      const { error } = await supabase.from('notes').insert([newNoteData]);
      if (error) throw error;
      setNotes([newNoteData, ...notes]);
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
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase.from('notes').update({ pinned: true }).eq('id', id);
      if (error) throw error;
      setNotes(notes => notes.map(note => note.id === id ? { ...note, pinned: true } : note));
      toast({ title: "Pinned!", description: "Note pinned to top." });
    } catch (error) {
      console.error("Error pinning note:", error);
      toast({ title: "Error", description: "Failed to pin note.", variant: "destructive" });
    }
  };

  const unpinNote = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').update({ pinned: false }).eq('id', id);
      if (error) throw error;
      setNotes(notes => notes.map(note => note.id === id ? { ...note, pinned: false } : note));
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
      const { error } = await supabase
        .from('notes')
        .update({ content: editContent, last_updated: new Date().toISOString() })
        .eq('id', editingId);
      if (error) throw error;
      setNotes(notes.map(note => note.id === editingId
        ? { ...note, content: editContent, last_updated: new Date().toISOString() }
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
    fetchNotes,
    setNotes,
    pinNote,
    unpinNote,
  };
}
