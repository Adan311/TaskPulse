
import React from "react";
import { NoteCard } from "./NoteCard";

interface NoteListProps {
  notes: any[];
  editingId: string | null;
  editContent: string;
  setEditContent: (v: string) => void;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  onStartEdit: (note: any) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}

export function NoteList({
  notes,
  editingId,
  editContent,
  setEditContent,
  editInputRef,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: NoteListProps) {
  return (
    <div className="grid gap-4">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          editing={editingId === note.id}
          editContent={editContent}
          setEditContent={setEditContent}
          editInputRef={editInputRef}
          onStartEdit={() => onStartEdit(note)}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </div>
  );
}
