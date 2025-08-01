
import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";

// Used for both filtering and assigning notes to projects
interface ProjectSelectProps {
  projects: { id: string; name: string }[];
  value: string;
  onChange: (val: string) => void;
  allOption?: boolean;
  disabled?: boolean;
}

export function ProjectSelect({
  projects,
  value,
  onChange,
  allOption = true,
  disabled = false,
}: ProjectSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full md:w-[200px]">
        <SelectValue placeholder={allOption ? "All Projects" : "Assign to project"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Projects</SelectLabel>
          {allOption && (
            <SelectItem value="all">All Notes</SelectItem>
          )}
          {projects.map(project => (
            <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
          ))}
          {projects.length === 0 && !allOption && (
            <SelectItem value="no-projects-placeholder" disabled>
              No projects available
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
