
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar
} from "@/frontend/components/ui/sidebar";
import { Home, Calendar, Clock, ListTodo, FileText, User, LogOut, ChevronLeft, ChevronRight, Files, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { logout } from "@/backend/api/services/auth.service";
import { useNavigate, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/components/ui/avatar";

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
    title: "Timer",
    url: "/timer",
    icon: Clock,
  },
  {
    title: "Files",
    url: "/files",
    icon: Files,
  },
];

const extraItems = [
  {
    title: "Projects",
    url: "/projects",
    icon: FileText,
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    async function getUserProfile() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    getUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/signin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getInitials = (email) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center justify-between p-2">
          <Link to="/" className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full bg-primary flex items-center justify-center ${isCollapsed ? "" : "mr-2"}`}>
              <span className="text-white font-bold">TP</span>
            </div>
            <span className={`font-bold text-xl ${isCollapsed ? "hidden" : "block"}`}>TaskPulse</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
        <SidebarSeparator />
        
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "opacity-0" : ""}>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "opacity-0" : ""}>Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {extraItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto">
        <SidebarSeparator />
        <div className="p-2">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 p-2 rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.email} />
                  <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isCollapsed ? "hidden" : "block"}`}>
                  <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <SidebarMenuButton 
                onClick={handleLogout} 
                tooltip={isCollapsed ? "Logout" : undefined}
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 p-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
              <div className={`space-y-1 ${isCollapsed ? "hidden" : "block"}`}>
                <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-2 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          ) : (
            <SidebarMenuButton 
              asChild
              tooltip={isCollapsed ? "Sign In" : undefined}
            >
              <Link to="/auth/signin" className="w-full justify-start">
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </SidebarMenuButton>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
