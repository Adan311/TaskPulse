import { useState, useEffect } from 'react';

export interface DashboardLayoutConfig {
  showAIChat: boolean;
  chatCollapsed: boolean;
  selectedView: 'overview' | 'calendar' | 'tasks' | 'projects' | 'notes';
}

const DEFAULT_LAYOUT: DashboardLayoutConfig = {
  showAIChat: true,
  chatCollapsed: false,
  selectedView: 'overview'
};

export const useDashboardLayout = () => {
  const [layoutConfig, setLayoutConfig] = useState<DashboardLayoutConfig>(DEFAULT_LAYOUT);

  // Load layout preferences from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setLayoutConfig({ ...DEFAULT_LAYOUT, ...parsed });
      } catch (error) {
        console.error('Error parsing saved layout:', error);
      }
    }
  }, []);

  // Save layout preferences to localStorage
  const saveLayout = (config: DashboardLayoutConfig) => {
    localStorage.setItem('dashboard-layout', JSON.stringify(config));
    setLayoutConfig(config);
  };

  const togglePanel = (panel: keyof DashboardLayoutConfig) => {
    const newConfig = {
      ...layoutConfig,
      [panel]: !layoutConfig[panel]
    };
    saveLayout(newConfig);
  };

  const updateLayout = (updates: Partial<DashboardLayoutConfig>) => {
    const newConfig = {
      ...layoutConfig,
      ...updates
    };
    saveLayout(newConfig);
  };

  const resetLayout = () => {
    saveLayout(DEFAULT_LAYOUT);
  };

  return {
    layoutConfig,
    togglePanel,
    updateLayout,
    resetLayout
  };
}; 