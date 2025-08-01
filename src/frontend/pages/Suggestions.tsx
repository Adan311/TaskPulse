import React from 'react';
import { AppLayout } from '@/frontend/components/layout/AppLayout';
import SuggestionList from '@/frontend/features/ai/components/SuggestionList';

export default function Suggestions() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <SuggestionList />
      </div>
    </AppLayout>
  );
} 