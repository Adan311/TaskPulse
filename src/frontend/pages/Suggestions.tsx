import React from 'react';
import SuggestionList from '@/frontend/features/suggestions/components/SuggestionList';
import { useSidebar } from "@/frontend/components/ui/sidebar/sidebar";

const SuggestionsPage: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <div className={`p-6 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
      <SuggestionList />
    </div>
  );
};

export default SuggestionsPage; 