import React, { useState } from "react";
import { Input } from "@/frontend/components/ui/input";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { Button } from "@/frontend/components/ui/button";
import { Pin, PinOff, MoreVertical } from "lucide-react";
import { useNotes } from "../hooks/useNotes";
import { ProjectSelectionModal } from "./ProjectSelectionModal";

interface NotesSidebarProps {
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string) => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({ selectedNoteId, setSelectedNoteId }) => {
  const { notes, startEdit, deleteNote, pinNote, unpinNote } = useNotes();
  const [search, setSearch] = useState("");

  // Filter and sort notes
  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(search.toLowerCase())
  );
  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const normalNotes = filteredNotes.filter(n => !n.pinned);

  return (
    <aside className="w-80 bg-muted border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        {pinnedNotes.length > 0 && (
          <div className="px-4 pt-2 pb-1 text-xs text-muted-foreground font-semibold">Pinned</div>
        )}
        {pinnedNotes.map(note => (
          <NotePreviewItem
            key={note.id}
            note={note}
            selected={selectedNoteId === note.id}
            setSelectedNoteId={setSelectedNoteId}
            pinAction={unpinNote}
            isPinned
          />
        ))}
        {normalNotes.length > 0 && (
          <div className="px-4 pt-2 pb-1 text-xs text-muted-foreground font-semibold">All Notes</div>
        )}
        {normalNotes.map(note => (
          <NotePreviewItem
            key={note.id}
            note={note}
            selected={selectedNoteId === note.id}
            setSelectedNoteId={setSelectedNoteId}
            pinAction={pinNote}
            isPinned={false}
          />
        ))}
      </ScrollArea>
    </aside>
  );
};

// Preview item with context menu
interface NotePreviewItemProps {
  note: any;
  selected: boolean;
  setSelectedNoteId: (id: string) => void;
  pinAction: (id: string) => void;
  isPinned: boolean;
}

const NotePreviewItem: React.FC<NotePreviewItemProps> = ({ note, selected, setSelectedNoteId, pinAction, isPinned }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const { deleteNote, projects, addNoteToProject } = useNotes();
  
  // Copy logic
  const handleCopy = async () => {
    await navigator.clipboard.writeText(note.content);
    setMenuOpen(false);
  };
  
  // Delete logic
  const handleDelete = async () => {
    await deleteNote(note.id);
    setMenuOpen(false);
  };
  
  // Add to project logic
  const handleAddToProject = () => {
    setMenuOpen(false);
    setProjectModalOpen(true);
  };
  
  const handleProjectSelected = async (projectId: string) => {
    await addNoteToProject(note.id, projectId);
    setProjectModalOpen(false);
  };
  
  return (
    <>
      <div
        className={`flex items-center px-4 py-2 cursor-pointer rounded-lg mb-1 hover:bg-accent ${selected ? "bg-accent/60 font-bold" : ""}`}
        onClick={() => setSelectedNoteId(note.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-base">{note.title || note.content.slice(0, 24) || "Untitled"}</span>
            {isPinned && <Pin className="w-4 h-4 text-primary" />}
            {note.project && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Project</span>}
          </div>
          <div className="truncate text-xs text-muted-foreground">{note.content.slice(0, 48)}</div>
        </div>
        <div className="ml-2 relative">
          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}>
            <MoreVertical className="w-4 h-4" />
          </Button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 z-10 bg-card border rounded shadow-lg p-1 min-w-[120px]">
              <button className="w-full px-3 py-1 text-left hover:bg-accent rounded text-sm" onClick={e => { e.stopPropagation(); pinAction(note.id); setMenuOpen(false); }}>{isPinned ? "Unpin" : "Pin"}</button>
              <button className="w-full px-3 py-1 text-left hover:bg-accent rounded text-sm" onClick={e => { e.stopPropagation(); handleCopy(); }}>Copy</button>
              <button className="w-full px-3 py-1 text-left hover:bg-accent rounded text-sm" onClick={e => { e.stopPropagation(); handleAddToProject(); }}>Add to Project</button>
              <button className="w-full px-3 py-1 text-left hover:bg-destructive/20 text-destructive rounded text-sm" onClick={e => { e.stopPropagation(); handleDelete(); }}>Delete</button>
            </div>
          )}
        </div>
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
