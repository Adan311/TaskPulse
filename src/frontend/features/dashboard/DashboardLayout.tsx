import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/frontend/components/layout/AppLayout';
import { useUser } from '@/frontend/components/ui/user-context';
import { DashboardHeader } from './DashboardHeader';
import { AIChatPanel } from './AIChatPanel';
import { MainContentArea } from './MainContentArea';
import { QuickInfoPanel } from './QuickInfoPanel';
import { useDashboardData } from './hooks/useDashboardData';
import { useDashboardLayout } from './hooks/useDashboardLayout';

interface DashboardLayoutProps {
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ className }) => {
  const { user } = useUser();
  const { layoutConfig, togglePanel, updateLayout } = useDashboardLayout();
  const { dashboardData, loading, refreshData } = useDashboardData();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={`min-h-screen bg-background ${className}`}>
        {/* Dashboard Header */}
        <DashboardHeader 
          user={user}
          layoutConfig={layoutConfig}
          onLayoutChange={updateLayout}
        />

        {/* Main Dashboard Grid */}
        <div className="p-6 max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* AI Chat Panel - Left Column (3 cols) */}
            {layoutConfig.showAIChat && (
              <div className="lg:col-span-3">
                <AIChatPanel 
                  collapsed={layoutConfig.chatCollapsed}
                  onToggleCollapse={() => togglePanel('chatCollapsed')}
                  dashboardData={dashboardData}
                />
              </div>
            )}

            {/* Main Content Area - Center Column (6 cols) */}
            <div className={`${layoutConfig.showAIChat ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
              <MainContentArea 
                selectedView={layoutConfig.selectedView}
                dashboardData={dashboardData}
                onRefreshData={refreshData}
              />
            </div>

            {/* Quick Info Panel - Right Column (3 cols) */}
            <div className="lg:col-span-3">
              <QuickInfoPanel 
                dashboardData={dashboardData}
                onRefreshData={refreshData}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}; 