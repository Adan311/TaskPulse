import React from 'react';
import { OverviewDashboard } from './views/OverviewDashboard';
import { QuickStatsWidget } from './widgets/QuickStatsWidget';
import { DashboardData } from './hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MainContentAreaProps {
  selectedView: 'overview' | 'calendar' | 'tasks' | 'projects' | 'notes';
  dashboardData: DashboardData;
  onRefreshData: () => void;
  className?: string;
}

export const MainContentArea: React.FC<MainContentAreaProps> = ({
  selectedView,
  dashboardData,
  onRefreshData,
  className
}) => {
  const navigate = useNavigate();

  const renderContent = () => {
    switch (selectedView) {
      case 'overview':
        return (
          <OverviewDashboard 
            dashboardData={dashboardData}
            onRefreshData={onRefreshData}
          />
        );
      case 'calendar':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Full calendar view coming soon. For now, check out your events in the sidebar!
              </p>
              <Button onClick={() => navigate('/calendar')}>
                Go to Full Calendar
              </Button>
            </CardContent>
          </Card>
        );
      case 'tasks':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tasks View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Full tasks view coming soon. For now, check out your tasks in the sidebar!
              </p>
              <Button onClick={() => navigate('/tasks')}>
                Go to Full Tasks
              </Button>
            </CardContent>
          </Card>
        );
      case 'projects':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Projects View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Projects view coming soon. 
              </p>
              <Button onClick={() => navigate('/projects')}>
                Go to Projects
              </Button>
            </CardContent>
          </Card>
        );
      case 'notes':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notes View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Notes view coming soon.
              </p>
              <Button onClick={() => navigate('/notes')}>
                Go to Notes
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Always show quick stats at the top */}
      <QuickStatsWidget 
        dashboardData={dashboardData}
        className="mb-6"
      />
      
      {/* Dynamic content based on selected view */}
      {renderContent()}
    </div>
  );
}; 