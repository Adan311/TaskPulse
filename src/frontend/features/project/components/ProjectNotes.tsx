import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNotes } from '@/frontend/features/notes/hooks/useNotes';
import { Button } from '@/frontend/components/ui/button';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Card } from '@/frontend/components/ui/card';
import { Pin, Trash, Copy, Edit2 } from 'lucide-react';

interface ProjectNotesProps {
  projectId: string;
}

export const ProjectNotes = forwardRef<{ handleNew: () => void }, ProjectNotesProps>(({ projectId }, ref) => {
  const {
    notes,
    user,
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
    selectedProject,
    setSelectedProject,
  } = useNotes();
  
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (user?.id) {
      fetchNotes(user.id);
    }
  }, [user, fetchNotes]);
  
  // Filter notes for this project
  const projectNotes = notes.filter(note => note.project === projectId);
  
  const handleNew = () => {
    setIsCreatingNote(true);
    setNewNoteContent('');
  };
  
  const handleSaveNewNote = async () => {
    if (!newNoteContent.trim() || !user?.id) return;
    
    setIsSubmitting(true);
    try {
      // Temporarily set the selectedProject to ensure the note is associated with this project
      const currentSelectedProject = selectedProject;
      setSelectedProject(projectId);
      
      // Add note with project association
      await addNote(newNoteContent);
      
      // Restore the original selected project
      setSelectedProject(currentSelectedProject);
      
      // Refresh notes
      fetchNotes(user.id);
      setIsCreatingNote(false);
      setNewNoteContent('');
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setIsCreatingNote(false);
    setNewNoteContent('');
  };
  
  // Export the handleNew function via the ref
  useImperativeHandle(ref, () => ({
    handleNew,
  }));
  
  if (!user) {
    return <div className="text-center p-6">Please sign in to manage notes.</div>;
  }
  
  return (
    <div className="space-y-4">
      {isCreatingNote ? (
        <Card className="p-4">
          <Textarea
            placeholder="Write your note here..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-[150px] mb-4"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNewNote} 
              disabled={!newNoteContent.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </Card>
      ) : (
        <Button onClick={handleNew}>New Note</Button>
      )}
      
      <ScrollArea className="h-[500px] pr-4">
        {projectNotes.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No notes yet. Create your first note!
          </div>
        ) : (
          <div className="space-y-4">
            {projectNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note}
                onPin={() => note.pinned ? unpinNote(note.id) : pinNote(note.id)}
                onDelete={() => deleteNote(note.id)}
                onEdit={() => startEdit(note)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

interface NoteCardProps {
  note: any;
  onPin: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onPin, onDelete, onEdit }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">
          {note.title || note.content.slice(0, 32) || "Untitled"}
        </h3>
        <div className="flex space-x-1">
          <Button size="icon" variant="ghost" onClick={onPin} title={note.pinned ? "Unpin" : "Pin"}>
            <Pin className={note.pinned ? "text-primary" : ""} size={16} />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCopy} title="Copy">
            <Copy size={16} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit} title="Edit">
            <Edit2 size={16} />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} title="Delete">
            <Trash size={16} className="text-destructive" />
          </Button>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm">
        {note.content}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        {new Date(note.last_updated).toLocaleString()}
      </div>
    </Card>
  );
}; 