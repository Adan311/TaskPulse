import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { NotesSidebar } from "@/frontend/features/notes/components/NotesSidebar";
import { NoteViewer } from "@/frontend/features/notes/components/NoteViewer";
import { useNotes } from "@/frontend/features/notes/hooks/useNotes";

const NotesPage: React.FC = () => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState<string>("");
  const {
    addNote,
    loading,
    fetchNotes,
    user,
    notes,
    pinNote,
    unpinNote,
    deleteNote,
    editingId,
    editContent,
    setEditContent,
    editInputRef,
    startEdit,
    saveEdit,
    cancelEdit
  } = useNotes();

  useEffect(() => {
    if (user && user.id) {
      fetchNotes(user.id);
    }
  }, [user, fetchNotes]);

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  
  const handlePin = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note?.pinned) {
      unpinNote(id);
    } else {
      pinNote(id);
    }
  };
  const handleDelete = (id: string) => {
    deleteNote(id);
    setSelectedNoteId(null);
  };
  const handleCopy = (content: string) => navigator.clipboard.writeText(content);
  const handleAddToProject = (id: string) => {
    // This function is not used by NoteViewer as it has its own project selection modal

  };

  // New: handle creating a new note from the main area
  const handleCreateNewNote = () => {
    setSelectedNoteId(null);
    setNewNoteContent("");
  };
  const handleSaveNewNote = async (content: string): Promise<void> => {
    if (!content.trim()) return;
    await addNote(content);
    fetchNotes(user.id); // refresh notes
    setNewNoteContent("");
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex gap-6 h-[calc(100vh-64px)]">
          <NotesSidebar selectedNoteId={selectedNoteId} setSelectedNoteId={setSelectedNoteId} />
          <div className="flex-1 bg-background rounded-2xl border shadow p-6">
            <div className="flex justify-between mb-4">
              <button className="btn btn-primary" onClick={handleCreateNewNote}>New Note</button>
            </div>
            <NoteViewer
              note={selectedNote}
              newNoteContent={newNoteContent}
              onNewNoteContentChange={setNewNoteContent}
              onSaveNewNote={handleSaveNewNote}
              editingId={editingId}
              editContent={editContent}
              setEditContent={setEditContent}
              editInputRef={editInputRef}
              startEdit={startEdit}
              saveEdit={saveEdit}
              cancelEdit={cancelEdit}
              onPin={handlePin}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onAddToProject={handleAddToProject}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotesPage;
