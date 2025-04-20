
import React from 'react';
import { useNotes } from "../hooks/useNotes";
import { ProjectSelect } from "./ProjectSelect";
import { NewNoteInput } from "./NewNoteInput";
import { NoteList } from "./NoteList";

export const NotesSection = () => {
  const {
    notes, projects, user, selectedProject, setSelectedProject, loading,
    addNote, deleteNote, editingId, editContent, setEditContent, editInputRef,
    startEdit, saveEdit, cancelEdit
  } = useNotes();

  const filteredNotes = selectedProject === 'all'
    ? notes
    : notes.filter(note => note.project === selectedProject);

  if (!user) {
    return <div className="text-center p-6">Please sign in to manage your notes.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <ProjectSelect
          projects={projects}
          value={selectedProject}
          onChange={setSelectedProject}
          allOption={true}
        />
        <NewNoteInput
          onAdd={addNote}
          selectedProject={selectedProject}
          projects={projects}
          setSelectedProject={setSelectedProject}
          loading={loading}
        />
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
          <NoteList
            notes={filteredNotes}
            editingId={editingId}
            editContent={editContent}
            setEditContent={setEditContent}
            editInputRef={editInputRef}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onDelete={deleteNote}
          />
        )}
      </div>
    </div>
  );
};
