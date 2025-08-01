import React from 'react';
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
    <div className="flex bg-muted rounded-md p-0.5">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(true)}
              className={`flex h-8 items-center gap-1.5 px-2.5 ${
                isDashboardView 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Dashboard</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Show all project content at once</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(false)}
              className={`flex h-8 items-center gap-1.5 px-2.5 ${
                !isDashboardView 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Tabbed</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Browse content by tabs</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}; 