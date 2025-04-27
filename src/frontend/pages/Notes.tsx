import React, { useState, useEffect } from 'react';
import { Button } from "@/frontend/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { NotesSection } from "@/frontend/features/notes/components/NotesSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useNotes } from "@/frontend/features/notes/hooks/useNotes";

const NotesPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const {
    addNote,
    loading,
    fetchNotes,
    user
  } = useNotes();

  const handleCreateNote = () => {
    setDialogOpen(true);
  };

  const handleSaveNote = async () => {
    setSaving(true);
    const success = await addNote(newNote);
    setSaving(false);
    if (success && user && user.id) {
      setDialogOpen(false);
      setNewNote("");
      fetchNotes(user.id);
    }
    // Error handling is inside addNote
  };

  useEffect(() => {
    if (user && user.id) {
      fetchNotes(user.id);
    }
  }, [user, fetchNotes]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-background">
      <div className="w-full max-w-2xl bg-card shadow-lg rounded-xl p-10 flex flex-col items-center">
        <FileText className="w-14 h-14 text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-2">Your Notes</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Keep your ideas organized. Create, edit, and search your notes here!
        </p>
        <Button size="lg" className="mb-8" onClick={handleCreateNote}>
          <Plus className="mr-2 h-5 w-5" />Create New Note
        </Button>
        <NotesSection />
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a New Note</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Write your note here..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            className="min-h-[120px] mb-4"
            disabled={saving}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={!newNote.trim() || saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesPage;
