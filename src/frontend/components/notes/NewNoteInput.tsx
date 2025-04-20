
import React, { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import { ProjectSelect } from "./ProjectSelect";

interface NewNoteInputProps {
  onAdd: (content: string) => Promise<boolean>;
  selectedProject: string;
  projects: { id: string; name: string }[];
  setSelectedProject: (id: string) => void;
  loading: boolean;
}

export function NewNoteInput({ onAdd, selectedProject, projects, setSelectedProject, loading }: NewNoteInputProps) {
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    if (await onAdd(input)) {
      setInput("");
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Textarea
        placeholder="Write a new note..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-[100px] resize-none"
      />
      <div className="flex justify-between items-center">
        <ProjectSelect
          projects={projects}
          value={selectedProject}
          onChange={setSelectedProject}
          allOption={false}
          disabled={projects.length === 0}
        />
        <Button onClick={handleAdd} disabled={!input.trim() || loading}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>
    </div>
  );
}
