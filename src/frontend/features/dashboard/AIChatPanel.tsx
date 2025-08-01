import React, { useState } from 'react';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { 
  MessageSquare, 
  Maximize2
} from 'lucide-react';
import { ChatWindow } from '@/frontend/features/ai/components/ChatWindow';
import { DashboardData } from './hooks/useDashboardData';

interface AIChatPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  dashboardData: DashboardData;
  className?: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  collapsed,
  onToggleCollapse,
  dashboardData,
  className
}) => {
  const [conversationId, setConversationId] = useState<string>('');

  const getContextualSuggestion = () => {
    const { stats } = dashboardData;
    
    if (stats.tasksTotal === 0) {
      return "It looks like you haven't created any tasks yet. Would you like me to help you get started with some productivity tips?";
    }
    
    if (stats.eventsToday > 0) {
      return `You have ${stats.eventsToday} event${stats.eventsToday > 1 ? 's' : ''} today. Would you like me to help you prepare or create tasks based on your schedule?`;
    }
    
    if (stats.tasksCompleted > 0) {
      return `Great job completing ${stats.tasksCompleted} task${stats.tasksCompleted > 1 ? 's' : ''}! Would you like me to help you plan what's next?`;
    }
    
    return "I'm here to help you stay productive! Ask me anything about your tasks, schedule, or projects.";
  };

  if (collapsed) {
    return (
      <Card className={`h-fit ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Ready to help</p>
            </div>
            
            <Button 
              onClick={onToggleCollapse}
              className="w-full"
              size="sm"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Expand Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Chat Window - Full Height */}
        <div className="flex-1 min-h-0">
          <ChatWindow 
            conversationId={conversationId}
            onNewConversation={setConversationId}
            onCollapse={onToggleCollapse}
          />
        </div>
      </CardContent>
    </Card>
  );
}; 