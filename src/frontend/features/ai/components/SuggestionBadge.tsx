import React from 'react';
import { Badge } from '@/frontend/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/frontend/components/ui/tooltip';

interface SuggestionBadgeProps {
  count?: number;
  messageId?: string;
}

/**
 * Badge component to indicate the presence of task/event suggestions
 */
export const SuggestionBadge: React.FC<SuggestionBadgeProps> = ({ count, messageId }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/suggestions');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className="ml-2 cursor-pointer hover:bg-amber-100 hover:text-amber-800 bg-amber-50 text-amber-700 transition-colors" 
            onClick={handleClick}
          >
            <Lightbulb className="h-3 w-3 mr-1 fill-amber-500" />
            {count ? `${count} Suggestion${count > 1 ? 's' : ''}` : 'View Suggestions'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>AI has found potential tasks or events! Click to view.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SuggestionBadge; 