import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/frontend/components/ui/user-context';
import { useToast } from '@/frontend/hooks/use-toast';
import { useGlobalTimer } from '@/frontend/context/TimerContext';

// Import services
import { getEvents, Event } from '@/backend/api/services/event.service';
import { fetchTasks } from '@/backend/api/services/task.service';
import { fetchProjects } from '@/backend/api/services/project.service';
import { getUserNotes, type NoteWithProject } from '@/backend/api/services/notes.service';

// Types
export interface DashboardStats {
  tasksCompleted: number;
  tasksTotal: number;
  eventsToday: number;
  eventsUpcoming: number;
  activeProjects: number;
  timeLoggedToday: number;
  weeklyProgress: number;
}

export interface DashboardData {
  stats: DashboardStats;
  events: Event[];
  tasks: any[];
  recentNotes: NoteWithProject[];
  activeProjects: any[];
  todayEvents: Event[];
  upcomingEvents: Event[];
  recentTasks: any[];
  completedTasks: any[];
}

export const useDashboardData = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const { timeStats } = useGlobalTimer();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      tasksCompleted: 0,
      tasksTotal: 0,
      eventsToday: 0,
      eventsUpcoming: 0,
      activeProjects: 0,
      timeLoggedToday: 0,
      weeklyProgress: 0
    },
    events: [],
    tasks: [],
    recentNotes: [],
    activeProjects: [],
    todayEvents: [],
    upcomingEvents: [],
    recentTasks: [],
    completedTasks: []
  });

  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load data in parallel
      const [eventsData, tasksData, projectsData, notesData] = await Promise.all([
        getEvents(),
        fetchTasks(),
        fetchProjects(),
        getUserNotes()
      ]);

      // Process events
      const today = new Date();
      const todayEvents = eventsData.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === today.toDateString();
      });

      const upcomingEvents = eventsData.filter(event => {
        const eventDate = new Date(event.startTime);
        const weekFromNow = new Date();
        weekFromNow.setDate(today.getDate() + 7);
        return eventDate > today && eventDate <= weekFromNow;
      });

      // Process tasks
      const completedTasks = tasksData.filter(task => task.status === 'done');
      const recentTasks = tasksData
        .filter(task => task.status !== 'done')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // Process projects
      const activeProjectsData = projectsData.filter(project => project.status === 'active');

      // Calculate stats
      const stats: DashboardStats = {
        tasksCompleted: completedTasks.length,
        tasksTotal: tasksData.length,
        eventsToday: todayEvents.length,
        eventsUpcoming: upcomingEvents.length,
        activeProjects: activeProjectsData.length,
        timeLoggedToday: timeStats?.todayMinutes || 0,
        weeklyProgress: tasksData.length > 0 ? Math.round((completedTasks.length / tasksData.length) * 100) : 0
      };

      // Update dashboard data
      setDashboardData({
        stats,
        events: eventsData,
        tasks: tasksData,
        recentNotes: notesData.slice(0, 3),
        activeProjects: activeProjectsData,
        todayEvents,
        upcomingEvents,
        recentTasks,
        completedTasks
      });

      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page."
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadDashboardData();
  }, [user, timeStats]);

  // Refresh data function
  const refreshData = async () => {
    await loadDashboardData();
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Memoize expensive calculations
  const memoizedStats = useMemo(() => {
    if (!dashboardData.tasks.length && !dashboardData.events.length) {
      return dashboardData.stats;
    }
    return dashboardData.stats;
  }, [dashboardData.stats, dashboardData.tasks.length, dashboardData.events.length]);

  return {
    dashboardData: {
      ...dashboardData,
      stats: memoizedStats
    },
    loading,
    lastRefresh,
    refreshData
  };
}; 