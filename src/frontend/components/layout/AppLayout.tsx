
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Calendar, Home, ListTodo, FileText, Settings, LogOut } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/api/client/supabase";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-muted/30 border-r hidden md:block">
        <div className="h-full flex flex-col">
          <div className="p-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold">TP</span>
              </div>
              <span className="font-bold text-xl">TaskPulse</span>
            </Link>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link to="/" className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-muted transition-colors">
                  <Home size={18} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/tasks" className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-muted transition-colors">
                  <ListTodo size={18} />
                  <span>Tasks</span>
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-muted transition-colors">
                  <Calendar size={18} />
                  <span>Calendar</span>
                </Link>
              </li>
              <li>
                <Link to="/projects" className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-muted transition-colors">
                  <FileText size={18} />
                  <span>Projects</span>
                </Link>
              </li>
              <li>
                <Link to="/settings" className="flex items-center space-x-2 py-2 px-3 rounded hover:bg-muted transition-colors">
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut size={18} className="mr-2" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
