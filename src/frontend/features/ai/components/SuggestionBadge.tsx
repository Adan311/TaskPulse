import React from 'react';
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Lightbulb, Eye } from 'lucide-react';
import { useNavigate } from "react-router-dom";

interface SuggestionBadgeProps {
  messageId: string;
}

/**
 * Badge component to indicate the presence of task/event suggestions
 */
const SuggestionBadge: React.FC<SuggestionBadgeProps> = ({ messageId }) => {
  const navigate = useNavigate();

  const handleViewSuggestions = () => {
    navigate('/suggestions');
  };

  return (
    <div className="inline-flex items-center gap-2 mt-2">
      <Badge 
        variant="outline" 
        className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-yellow-100 px-2 py-1"
      >
        <Lightbulb className="h-3 w-3 mr-1 text-amber-500" />
        <span className="text-xs font-medium">AI Suggestions Available</span>
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleViewSuggestions}
        className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
      >
        <Eye className="h-3 w-3 mr-1" />
        View
      </Button>
    </div>
  );
};

export default SuggestionBadge; 