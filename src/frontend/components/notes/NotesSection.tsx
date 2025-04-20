
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/frontend/components/ui/button';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { PlusCircle, Trash2, Edit, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/frontend/hooks/use-toast';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { v4 as uuidv4 } from 'uuid';

export const NotesSection = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const { toast } = useToast();
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user', userId);

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
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;

    try {
      setLoading(true);
      
      const newNoteData = {
        id: uuidv4(),
        content: newNote,
        user: user.id,
        project: selectedProject === 'all' ? null : selectedProject,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notes')
        .insert([newNoteData]);

      if (error) throw error;

      setNotes([newNoteData, ...notes]);
      setNewNote('');
      toast({
        title: "Success!",
        description: "Your note has been added.",
      });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add your note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (note: any) => {
    setEditingId(note.id);
    setEditContent(note.content);
    
    // Focus the input after render
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 10);
  };

  const saveEdit = async () => {
    if (!editContent.trim() || !editingId) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
          content: editContent,
          last_updated: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      setNotes(notes.map(note => 
        note.id === editingId 
          ? { ...note, content: editContent, last_updated: new Date().toISOString() } 
          : note
      ));
      
      setEditingId(null);
      toast({
        title: "Success!",
        description: "Your note has been updated.",
      });
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update your note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== id));
      toast({
        title: "Success!",
        description: "Your note has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete your note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredNotes = selectedProject === 'all'
    ? notes
    : notes.filter(note => note.project === selectedProject);

  if (!user) {
    return <div className="text-center p-6">Please sign in to manage your notes.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <Select 
          value={selectedProject} 
          onValueChange={setSelectedProject}
        >
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Projects</SelectLabel>
              <SelectItem value="all">All Notes</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
              {projects.length === 0 && (
                <SelectItem value="no-projects" disabled>No projects available</SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="flex flex-col space-y-2">
          <Textarea
            placeholder="Write a new note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-between items-center">
            <Select 
              value={selectedProject === 'all' ? undefined : selectedProject}
              onValueChange={setSelectedProject}
              disabled={projects.length === 0}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Assign to project" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Projects</SelectLabel>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                  {projects.length === 0 && (
                    <SelectItem value="no-projects-available" disabled>No projects</SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button onClick={addNote} disabled={!newNote.trim() || loading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Your Notes</h3>
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notes found. Add your first note above!
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNotes.map(note => (
              <Card key={note.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        ref={editInputRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveEdit} disabled={!editContent.trim()}>
                          <Check className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="whitespace-pre-wrap mb-4">{note.content}</div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          {new Date(note.last_updated).toLocaleString()}
                        </span>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(note)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
