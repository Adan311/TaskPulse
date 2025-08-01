import { useState, useEffect } from 'react';

type ViewMode = 'dashboard' | 'tabbed';

export function useViewMode(projectId: string) {
  // Determine initial view mode from localStorage or default to 'tabbed'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Get stored preference for this project
    const storedViewMode = localStorage.getItem(`project-${projectId}-view-mode`);
    
    // Check if there's a stored value and it's a valid ViewMode
    if (storedViewMode && (storedViewMode === 'dashboard' || storedViewMode === 'tabbed')) {
      return storedViewMode as ViewMode;
    }
    
    // Otherwise default to tabbed view
    return 'tabbed';
  });

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'dashboard' ? 'tabbed' : 'dashboard');
  };

  const setDashboardView = () => {
    setViewMode('dashboard');
  };

  const setTabbedView = () => {
    setViewMode('tabbed');
  };

  // Save to localStorage whenever viewMode changes
  useEffect(() => {
    localStorage.setItem(`project-${projectId}-view-mode`, viewMode);
  }, [viewMode, projectId]);

  return {
    viewMode,
    isDashboardView: viewMode === 'dashboard',
    isTabbedView: viewMode === 'tabbed',
    toggleViewMode,
    setDashboardView,
    setTabbedView
  };
} 