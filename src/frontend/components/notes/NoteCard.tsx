
import React from "react";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Edit, Trash2, Check, X } from "lucide-react";

interface NoteCardProps {
  note: any;
  editing: boolean;
  editContent: string;
  setEditContent: (v: string) => void;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

export function NoteCard({
  note,
  editing,
  editContent,
  setEditContent,
  editInputRef,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete
}: NoteCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              ref={editInputRef}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={onCancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={onSaveEdit} disabled={!editContent.trim()}>
                <Check className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="whitespace-pre-wrap mb-4">{note.content}</div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {note.last_updated ? new Date(note.last_updated).toLocaleString() : ""}
              </span>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={onStartEdit}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
