import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNotes } from '@/frontend/features/notes/hooks/useNotes';
import { Button } from '@/frontend/components/ui/button';
import { ScrollArea } from '@/frontend/components/ui/scroll-area';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Card } from '@/frontend/components/ui/card';
import { Pin, Trash, Copy, Edit2, Search, Save, X, Unlink } from 'lucide-react';
import { Input } from '@/frontend/components/ui/input';
import { supabase } from '@/backend/database/client';

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
    unlinkNoteFromProject,
  } = useNotes();
  
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (user?.id) {
      fetchNotes(user.id);
    }
  }, [user, fetchNotes]);
  
  // Filter notes for this project and by search term if provided
  const projectNotes = notes
    .filter(note => note.project === projectId)
    .filter(note => searchTerm === '' || note.content.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const handleNew = () => {
    setIsCreatingNote(true);
    setNewNoteContent('');
  };
  
  const handleSaveNewNote = async () => {
    if (!newNoteContent.trim() || !user?.id) return;
    
    setIsSubmitting(true);
    try {
      // Create the note data directly with project association to avoid any synchronization issues
      const newNoteData = {
        id: crypto.randomUUID(),
        content: newNoteContent,
        user: user.id,
        project: projectId, // Directly set the projectId here
        last_updated: new Date().toISOString(),
        pinned: false
      };
      
      // Insert the note directly into the database
      const { error } = await supabase.from('notes').insert([newNoteData]);
      if (error) throw error;
      
      // Refresh the notes list
      fetchNotes(user.id);
      
      // Reset the form
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
      <div className="flex justify-between items-center gap-4">
        {!isCreatingNote && (
          <Button onClick={handleNew}>New Note</Button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
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
      ) : null}
      
      <ScrollArea className="h-[500px] pr-4">
        {projectNotes.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            {searchTerm ? 'No notes match your search.' : 'No notes yet. Create your first note!'}
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
                onUnlink={() => unlinkNoteFromProject(note.id)}
                isEditing={editingId === note.id}
                editContent={editContent}
                onEditChange={setEditContent}
                editInputRef={editInputRef}
                onSave={saveEdit}
                onCancel={cancelEdit}
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
  onUnlink?: () => void;
  isEditing: boolean;
  editContent: string;
  onEditChange: (content: string) => void;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  onSave: () => Promise<boolean>;
  onCancel: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onPin, 
  onDelete, 
  onEdit,
  onUnlink,
  isEditing,
  editContent,
  onEditChange,
  editInputRef,
  onSave,
  onCancel
}) => {
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
          {isEditing ? (
            <>
              <Button size="icon" variant="ghost" onClick={onSave} title="Save">
                <Save size={16} />
              </Button>
              <Button size="icon" variant="ghost" onClick={onCancel} title="Cancel">
                <X size={16} />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={onPin} title={note.pinned ? "Unpin" : "Pin"}>
                <Pin className={note.pinned ? "text-primary" : ""} size={16} />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCopy} title="Copy">
                <Copy size={16} />
              </Button>
              <Button size="icon" variant="ghost" onClick={onEdit} title="Edit">
                <Edit2 size={16} />
              </Button>
              {onUnlink && (
                <Button size="icon" variant="ghost" onClick={onUnlink} title="Unlink from project">
                  <Unlink size={16} className="text-muted-foreground" />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={onDelete} title="Delete">
                <Trash size={16} className="text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <Textarea
          ref={editInputRef}
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="min-h-[100px] mb-4"
          placeholder="Edit your note..."
        />
      ) : (
        <div className="text-sm">
          <div className="whitespace-pre-wrap line-clamp-3">
            {note.content}
          </div>
          {note.content.length > 150 && (
            <Button 
              variant="link" 
              className="text-xs p-0 h-auto mt-1 text-muted-foreground hover:text-primary" 
              onClick={onEdit}
            >
              View more
            </Button>
          )}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-2">
        {new Date(note.last_updated).toLocaleString()}
      </div>
    </Card>
  );
};