
import React, { useState, useEffect } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/frontend/hooks/use-toast";
import { Badge } from "@/frontend/components/ui/badge";
import { Book, Edit, Plus, Trash2 } from "lucide-react";
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '@/backend/api/services/project.service';

interface Note {
  id: string;
  content?: string | null;
  project?: string | null;
  user?: string | null;
  last_updated?: string | null;
}

export function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState({ content: "", project: "" });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user', user.id);

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save notes",
          variant: "destructive",
        });
        return;
      }

      if (!newNote.content.trim()) {
        toast({
          title: "Error",
          description: "Note content cannot be empty",
          variant: "destructive",
        });
        return;
      }

      const noteData = {
        content: newNote.content,
        user: user.id,
        project: newNote.project || null,
        last_updated: new Date().toISOString()
      };

      if (selectedNote) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', selectedNote.id);

        if (error) throw error;
        
        toast({
          title: "Note updated",
          description: "Your note has been updated successfully",
        });
      } else {
        // Create new note
        const { error } = await supabase
          .from('notes')
          .insert([noteData]);

        if (error) throw error;
        
        toast({
          title: "Note created",
          description: "Your note has been saved successfully",
        });
      }

      setNewNote({ content: "", project: "" });
      setSelectedNote(null);
      setDialogOpen(false);
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNotes(notes.filter(note => note.id !== id));
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setNewNote({
      content: note.content || "",
      project: note.project || ""
    });
    setDialogOpen(true);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  if (loading) {
    return <div className="py-8 text-center">Loading notes...</div>;
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Notes</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setSelectedNote(null);
                setNewNote({ content: "", project: "" });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{selectedNote ? "Edit Note" : "Create New Note"}</DialogTitle>
              <DialogDescription>
                {selectedNote ? "Make changes to your note." : "Add a new note to your collection."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="note-content">Content</Label>
                <Textarea 
                  id="note-content"
                  placeholder="Enter your note here..." 
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  className="min-h-[200px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note-project">Link to Project (Optional)</Label>
                <Select 
                  value={newNote.project} 
                  onValueChange={(value) => setNewNote({...newNote, project: value})}
                >
                  <SelectTrigger id="note-project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveNote}>{selectedNote ? "Update" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <Book className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-6">Create your first note to get started</p>
          <Button 
            onClick={() => {
              setSelectedNote(null); 
              setNewNote({ content: "", project: "" });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create a Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="transition-all duration-200"
            >
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Book className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.last_updated)}
                      </span>
                    </div>
                    {note.project && (
                      <Badge variant="outline" className="ml-auto">
                        {getProjectName(note.project)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="whitespace-pre-wrap text-sm">
                    {note.content?.substring(0, 150)}
                    {(note.content?.length || 0) > 150 && "..."}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-3">
                  <div className="flex justify-between items-center w-full">
                    <Button variant="ghost" size="sm" onClick={() => handleEditNote(note)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
