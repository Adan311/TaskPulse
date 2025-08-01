import React, { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Pin, PinOff, Trash, Copy, FolderPlus, Edit2, Save, X } from "lucide-react";
import { ProjectSelectionModal } from "./ProjectSelectionModal";
import { useNotes } from "../hooks/useNotes";

interface NoteViewerProps {
  note: any | null;
  newNoteContent: string;
  onNewNoteContentChange: (content: string) => void;
  onSaveNewNote: (content: string) => Promise<void>;
  editingId: string | null;
  editContent: string;
  setEditContent: (content: string) => void;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  startEdit: (note: any) => void;
  saveEdit: () => Promise<boolean>;
  cancelEdit: () => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onAddToProject: (id: string) => void;
}

export const NoteViewer: React.FC<NoteViewerProps> = ({
  note,
  newNoteContent,
  onNewNoteContentChange,
  onSaveNewNote,
  editingId,
  editContent,
  setEditContent,
  editInputRef,
  startEdit,
  saveEdit,
  cancelEdit,
  onPin,
  onDelete,
  onCopy,
  onAddToProject
}) => {
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const { projects, addNoteToProject } = useNotes();
  
  const isNew = note === null;
  const isEditing = note !== null && editingId === note.id;
  
  const handleAddToProject = () => {
    setProjectModalOpen(true);
  };
  
  const handleProjectSelected = async (projectId: string) => {
    await addNoteToProject(note.id, projectId);
    setProjectModalOpen(false);
  };

  if (isNew) {
    return (
      <div className="flex flex-col h-full p-8">
        <textarea
          ref={editInputRef}
          className="flex-1 w-full bg-background rounded-lg p-4 border resize-none text-base"
          placeholder="Start typing to create a new note..."
          value={newNoteContent}
          onChange={e => onNewNoteContentChange(e.target.value)}
          autoFocus
        />
        <Button className="mt-4" onClick={() => onSaveNewNote(newNoteContent)} disabled={!newNoteContent.trim()}>
          Save
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full p-8">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold flex-1 truncate">
            {note.title || note.content.slice(0, 32) || "Untitled"}
          </h2>
          {note.project && (
            <div className="px-2 py-1 bg-primary/10 text-primary text-sm rounded">
              Project Linked
            </div>
          )}
          <Button size="icon" variant="ghost" onClick={() => onPin(note.id)} title={note.pinned ? "Unpin" : "Pin"}>
            {note.pinned ? <Pin className="text-primary" /> : <PinOff />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onCopy(note.content)} title="Copy">
            <Copy />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleAddToProject} title="Add to Project">
            <FolderPlus />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(note.id)} title="Delete">
            <Trash className="text-destructive" />
          </Button>
          {isEditing ? (
            <>
              <Button size="icon" variant="ghost" onClick={saveEdit} title="Save">
                <Save />
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel">
                <X />
              </Button>
            </>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => startEdit(note)} title="Edit">
              <Edit2 />
            </Button>
          )}
        </div>
        {isEditing ? (
          <textarea
            ref={editInputRef}
            className="flex-1 w-full bg-background rounded-lg p-4 border resize-none text-base"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            autoFocus
            placeholder="Edit your note here..."
          />
        ) : (
          <div className="flex-1 overflow-auto whitespace-pre-wrap text-base bg-background rounded-lg p-4 border">
            {note.content}
          </div>
        )}
      </div>
      
      <ProjectSelectionModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        projects={projects}
        onSelect={handleProjectSelected}
        onCancel={() => setProjectModalOpen(false)}
      />
    </>
  );
};
