import React from 'react';
import { Badge } from '@/frontend/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuggestionBadgeProps {
  count?: number;
  messageId?: string;
}

/**
 * Badge component to indicate the presence of task/event suggestions
 */
export const SuggestionBadge: React.FC<SuggestionBadgeProps> = ({ count, messageId }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/suggestions');
  };

  return (
    <Badge 
      variant="secondary" 
      className="ml-2 cursor-pointer hover:bg-secondary/80 transition-colors" 
      onClick={handleClick}
    >
      <Lightbulb className="h-3 w-3 mr-1" />
      {count ? `${count} Suggestion${count > 1 ? 's' : ''}` : 'Suggestions'}
    </Badge>
  );
};

export default SuggestionBadge; 