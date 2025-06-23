import { ReactNode } from "react";
import { useToast } from "@/frontend/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/frontend/components/ui/sidebar/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth/signin");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
