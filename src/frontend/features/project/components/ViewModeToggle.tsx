import React from 'react';
import { Switch } from '@/frontend/components/ui/switch';
import { Label } from '@/frontend/components/ui/label';
import { Button } from '@/frontend/components/ui/button';
import { LayoutDashboard, LayoutList } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/frontend/components/ui/tooltip';

interface ViewModeToggleProps {
  isDashboardView: boolean;
  onToggle: (isDashboard: boolean) => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  isDashboardView,
  onToggle,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isDashboardView ? "default" : "outline"}
              size="sm"
              onClick={() => onToggle(true)}
              className="flex items-center space-x-1"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline-block">Dashboard</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Show all project content at once</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={!isDashboardView ? "default" : "outline"}
              size="sm"
              onClick={() => onToggle(false)}
              className="flex items-center space-x-1"
            >
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline-block">Tabbed</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Browse content by tabs</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}; 