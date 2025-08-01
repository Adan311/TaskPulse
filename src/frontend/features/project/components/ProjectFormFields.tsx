import React from 'react';
import { Project } from '@/backend/database/schema';
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/frontend/components/ui/select";
import { Label } from "@/frontend/components/ui/label";
import { Slider } from "@/frontend/components/ui/slider";
import { Calendar } from 'lucide-react';

interface ProjectFormFieldsProps {
  // Form values
  name: string;
  description: string;
  dueDate?: string;
  status?: Project['status'];
  priority: Project['priority'];
  color: string;
  progress?: number;
  
  // Event handlers
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDueDateChange?: (value: string) => void;
  onStatusChange?: (value: Project['status']) => void;
  onPriorityChange: (value: Project['priority']) => void;
  onColorChange: (value: string) => void;
  onProgressChange?: (value: number) => void;
  
  // Display options
  isEditMode?: boolean; // Whether to show edit-only fields like progress
  fieldPrefix?: string; // Optional prefix for field IDs
}

export const ProjectFormFields: React.FC<ProjectFormFieldsProps> = ({
  // Form values  
  name,
  description,
  dueDate,
  status = 'active',
  priority,
  color,
  progress = 0,
  
  // Event handlers
  onNameChange,
  onDescriptionChange,
  onDueDateChange,
  onStatusChange,
  onPriorityChange,
  onColorChange,
  onProgressChange,
  
  // Display options
  isEditMode = false,
  fieldPrefix = '',
}) => {
  // Generate field IDs with optional prefix
  const idPrefix = fieldPrefix ? `${fieldPrefix}-` : '';
  
  return (
    <div className="grid gap-4 py-4">
      {/* Project Name */}
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}name`}>Project Name *</Label>
        <Input
          id={`${idPrefix}name`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter project name"
          required
        />
      </div>
      
      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}description`}>Description</Label>
        <Textarea
          id={`${idPrefix}description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter project description"
          rows={3}
        />
      </div>
      
      {/* Due Date - Only shown in edit mode or if handler provided */}
      {(isEditMode || onDueDateChange) && (
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}due-date`}>Due Date</Label>
          <div className="relative">
            <Input
              id={`${idPrefix}due-date`}
              type="date"
              value={dueDate ? dueDate.substring(0, 10) : ''}
              onChange={(e) => onDueDateChange?.(e.target.value)}
              placeholder="Select due date"
              className="pr-10"
            />
            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}
      
      {/* Status and Priority */}
      <div className="grid grid-cols-2 gap-4">
        {/* Status - Only shown in edit mode or if handler provided */}
        {(isEditMode || onStatusChange) && (
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}status`}>Status</Label>
            <Select 
              value={status} 
              onValueChange={(value: Project['status']) => onStatusChange?.(value)}
            >
              <SelectTrigger id={`${idPrefix}status`}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Priority */}
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}priority`}>Priority</Label>
          <Select 
            value={priority} 
            onValueChange={(value: Project['priority']) => onPriorityChange(value)}
          >
            <SelectTrigger id={`${idPrefix}priority`}>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Color */}
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}color`}>Color</Label>
        <div className="flex items-center space-x-2">
          <div 
            className="w-6 h-6 rounded-full border border-gray-300" 
            style={{ backgroundColor: color }}
          />
          <Input 
            type="color" 
            id={`${idPrefix}color`}
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-16 h-8" 
          />
        </div>
      </div>
      
      {/* Progress Slider - Only shown in edit mode */}
      {isEditMode && onProgressChange && (
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`${idPrefix}progress`}>Progress ({progress}%)</Label>
          </div>
          <Slider
            id={`${idPrefix}progress`}
            value={[progress]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => onProgressChange(value[0])}
            className="py-1"
          />
        </div>
      )}
    </div>
  );
}; 