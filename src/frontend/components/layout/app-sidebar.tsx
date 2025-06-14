import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar
} from "@/frontend/components/ui/sidebar";
import { Home, Calendar, Clock, ListTodo, FileText, User, LogOut, ChevronLeft, ChevronRight, Files, Settings, Sun, Moon, MessageSquare, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { supabase } from "@/backend/database/client";
import { logout } from "@/frontend/utils/auth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/components/ui/avatar";
import { useTheme } from "@/frontend/components/theme/theme-provider";
import { ModeToggle } from "@/frontend/components/theme/mode-toggle";
import { useUser } from "@/frontend/components/ui/user-context";
import { getSuggestionCounts } from "@/backend/api/services/ai/suggestions/suggestionService";
import { Badge } from "@/frontend/components/ui/badge";
import { GlobalTimerStatusBadge } from "@/frontend/components/timer/GlobalTimerStatusBadge";
import { a11y, focusRing } from "@/frontend/utils/accessibility";

const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Notes",
    url: "/notes",
    icon: FileText,
  },
  {
    title: "Timer",
    url: "/timer",
    icon: Clock,
  },
  {
    title: "Files",
    url: "/files",
    icon: Files,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FileText,
  },
  {
    title: "AI Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Suggestions",
    url: "/suggestions",
    icon: Lightbulb,
    badge: true, // This indicates this item can show a badge
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const isCollapsed = state === "collapsed";
  const { theme, setTheme } = useTheme();
  const [suggestionCount, setSuggestionCount] = useState(0);

  // Fetch suggestion counts when the sidebar is loaded
  useEffect(() => {
    const loadSuggestionCounts = async () => {
      if (user) {
        try {
          const counts = await getSuggestionCounts(user.id);
          setSuggestionCount(counts.tasks + counts.events);
        } catch (error) {
          console.error("Error loading suggestion counts:", error);
        }
      }
    };

    loadSuggestionCounts();
    
    // Set up a polling interval to check for new suggestions
    const interval = setInterval(loadSuggestionCounts, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      // Announce to screen readers
      a11y.announce("Logged out successfully", "polite");
      // Navigate to home page, which will show landing page for logged-out users
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      a11y.announce("Error logging out. Please try again.", "assertive");
    }
  };

  const getInitials = (email) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  const isCurrentPage = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  const navigationItems = mainItems;

  return (
    <Sidebar>
      <SidebarContent>
        {/* App header with logo */}
        <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col gap-2 py-4' : 'p-4'} border-b border-border mb-2`}>
          <Link 
            to="/" 
            className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'} ${focusRing} rounded-md`}
            aria-label="TaskPulse - Go to dashboard"
          >
            <div className={`w-9 h-9 rounded-full bg-primary flex items-center justify-center`}>
              <span className="text-primary-foreground font-bold text-lg" aria-hidden="true">TP</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-2xl tracking-tight ml-2">TaskPulse</span>
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className={`mt-2 ${isCollapsed ? 'mx-auto' : ''} h-9 w-9 flex items-center justify-center ${focusRing}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            aria-controls="sidebar-content"
          >
            {isCollapsed ? 
              <ChevronRight size={20} aria-hidden="true" /> : 
              <ChevronLeft size={20} aria-hidden="true" />
            }
          </Button>
        </div>
        
        <div className="mt-4" />
        
        {/* Main navigation */}
        <SidebarGroupContent id="sidebar-content">
          <SidebarMenu role="list" aria-label="Main navigation">
            {navigationItems.map((item, idx) => {
              const isCurrent = isCurrentPage(item.url);
              return (
                <SidebarMenuItem key={item.title} role="listitem">
                  <SidebarMenuButton 
                    asChild
                    tooltip={isCollapsed ? item.title : undefined}
                    className={`flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-2'} rounded-lg hover:bg-accent/70 transition-all duration-150 group ${focusRing} ${
                      isCurrent ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <Link 
                      to={item.url} 
                      className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3 w-full'}`}
                      aria-current={isCurrent ? 'page' : undefined}
                      aria-describedby={item.badge && suggestionCount > 0 ? `${item.title}-badge` : undefined}
                    >
                      <div className="relative">
                        <item.icon 
                          className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-150" 
                          aria-hidden="true"
                        />
                        {item.badge && suggestionCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                            aria-label={`${suggestionCount} new suggestions`}
                          >
                            {suggestionCount > 99 ? '99+' : suggestionCount}
                          </Badge>
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors duration-150">
                            {item.title}
                          </span>
                          {item.badge && suggestionCount > 0 && (
                            <Badge 
                              variant="secondary" 
                              id={`${item.title}-badge`}
                              aria-label={`${suggestionCount} new suggestions`}
                            >
                              {suggestionCount > 99 ? '99+' : suggestionCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                  {/* Add space between pages, except after last item */}
                  {idx !== mainItems.length - 1 && <div className="h-3" />}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
        
        {/* Global Timer Status */}
        <div className="mt-4 px-2" role="complementary" aria-label="Timer status">
          <GlobalTimerStatusBadge 
            compact={isCollapsed} 
            showControls={!isCollapsed}
            className={isCollapsed ? "justify-center" : "justify-start"}
          />
        </div>
      </SidebarContent>

      <SidebarFooter className="mt-auto" role="contentinfo" aria-label="User controls">
        <div className="p-2 flex flex-col gap-2">
          {/* Theme toggle with label when expanded */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
            <div className={focusRing}>
              <ModeToggle />
            </div>
            {!isCollapsed && (
              <span className="text-sm text-muted-foreground" id="theme-label">
                Theme
              </span>
            )}
          </div>
          
          {user ? (
            <div className="flex flex-col gap-2">
              {/* User profile section */}
              <div 
                className={`flex items-center p-2 rounded-md ${isCollapsed ? 'justify-center' : 'gap-2'}`}
                role="region"
                aria-label="User profile"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src="" 
                    alt={`Profile picture for ${user.email}`} 
                  />
                  <AvatarFallback>
                    {user.user_metadata?.first_name ? 
                      user.user_metadata.first_name.substring(0,2).toUpperCase() : 
                      getInitials(user.email)
                    }
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isCollapsed ? 'hidden' : 'block'}`}>
                  <span className="text-sm font-medium">
                    {user.user_metadata?.first_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
              
              {/* Logout button */}
              <SidebarMenuButton 
                onClick={handleLogout} 
                tooltip={isCollapsed ? "Logout" : undefined}
                className={`w-full flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-start'} text-muted-foreground hover:text-primary ${focusRing}`}
                aria-label="Sign out of your account"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {!isCollapsed && <span>Logout</span>}
              </SidebarMenuButton>
            </div>
          ) : (
            <SidebarMenuButton 
              asChild
              tooltip={isCollapsed ? "Sign In" : undefined}
              className={`w-full flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-start'} text-muted-foreground hover:text-primary ${focusRing}`}
            >
              <Link 
                to="/auth/signin" 
                className="w-full justify-start"
                aria-label="Sign in to your account"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                {!isCollapsed && <span>Sign In</span>}
              </Link>
            </SidebarMenuButton>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
