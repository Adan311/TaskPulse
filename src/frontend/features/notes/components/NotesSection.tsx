// src/frontend/features/notes/components/NotesSection.tsx
import React, { useState, useEffect } from 'react';
import { useNotes } from '../hooks/useNotes';
import { NotesSidebar } from './NotesSidebar';
import { NoteViewer } from './NoteViewer';
import { Button } from '@/frontend/components/ui/button';

export const NotesSection: React.FC = () => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const {
    user,
    notes,
    fetchNotes,
    addNote,
    deleteNote,
    pinNote,
    unpinNote,
    editingId,
    editContent,
    setEditContent,
    editInputRef,
    startEdit,
    saveEdit,
    cancelEdit,
  } = useNotes();

  // load fresh notes on login
  useEffect(() => {
    if (user?.id) fetchNotes(user.id);
  }, [user, fetchNotes]);

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;
  const handlePin      = (id: string) => { const n = notes.find(x => x.id === id); n?.pinned ? unpinNote(id) : pinNote(id); };
  const handleDelete   = (id: string) => { deleteNote(id); setSelectedNoteId(null); };
  const handleCopy     = (c: string)   => navigator.clipboard.writeText(c);
  const handleAddToProj= (id: string)  => { 
    // This function is not used as the NoteViewer handles project selection internally
  };

  const handleNew      = ()             => { setSelectedNoteId(null); setNewNoteContent(''); };
  const handleSaveNew  = async (c: string) => {
    if (!c.trim() || !user?.id) return;
    await addNote(c);
    fetchNotes(user.id);
    setNewNoteContent('');
  };

  if (!user) {
    return <div className="text-center p-6">Please sign in to manage your notes.</div>;
  }

  return (
    <div className="flex h-full gap-6">
      <NotesSidebar
        selectedNoteId={selectedNoteId}
        setSelectedNoteId={setSelectedNoteId}
      />

      <div className="flex-1 flex flex-col bg-background rounded-2xl border shadow p-6">
        <div className="flex justify-between mb-4">
          <Button onClick={handleNew}>New Note</Button>
        </div>
        <NoteViewer
          note={selectedNote}
          newNoteContent={newNoteContent}
          onNewNoteContentChange={setNewNoteContent}
          onSaveNewNote={handleSaveNew}
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
          onAddToProject={handleAddToProj}
        />
      </div>
    </div>
  );
};