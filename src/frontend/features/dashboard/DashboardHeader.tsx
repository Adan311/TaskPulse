import React from 'react';
import { Button } from '@/frontend/components/ui/button';
import { 
  Settings, 
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlobalTimerStatusBadge } from '@/frontend/components/timer/GlobalTimerStatusBadge';
import { DashboardLayoutConfig } from './hooks/useDashboardLayout';

interface DashboardHeaderProps {
  user: any;
  layoutConfig: DashboardLayoutConfig;
  onLayoutChange: (updates: Partial<DashboardLayoutConfig>) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  layoutConfig,
  onLayoutChange
}) => {
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (!user?.email) return 'there';
    return user.email.split('@')[0];
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="p-6 max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between">
          {/* Left side - Greeting and view selector */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {getGreeting()}, {getUserName()}! 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Here's what's happening with your productivity today
              </p>
            </div>


          </div>

          {/* Right side - Status and controls */}
          <div className="flex items-center gap-3">
            {/* Timer status */}
            <GlobalTimerStatusBadge />

            {/* Layout controls */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={layoutConfig.showAIChat ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => onLayoutChange({ showAIChat: !layoutConfig.showAIChat })}
                title="Toggle AI Chat"
              >
                🤖
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => window.location.reload()}
                title="Refresh Dashboard"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Settings */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 