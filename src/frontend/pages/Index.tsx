import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, ListTodo, FileText, Star } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { logout } from "@/frontend/utils/auth";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth/signin");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  return (
    <AppLayout>
      <div 
        className="p-6 max-w-7xl mx-auto"
        data-testid="dashboard-container"
      >
        <div className="text-center mb-12">
          <h1 
            className="text-4xl font-bold tracking-tight mb-4"
            data-testid="dashboard-welcome-heading"
          >
            Welcome to TaskPulse
          </h1>
          <p 
            className="text-xl text-muted-foreground"
            data-testid="dashboard-description"
          >
            Your AI-powered productivity dashboard
          </p>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="mt-4"
            data-testid="logout-button"
            aria-label="Log Out"
          >
            Log Out
          </Button>
        </div>

        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          data-testid="dashboard-navigation-cards"
        >
          <div 
            className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
            data-testid="calendar-card"
          >
            <Calendar className="w-12 h-12 text-primary mb-4" data-testid="calendar-icon" />
            <h2 
              className="text-2xl font-semibold mb-2"
              data-testid="calendar-card-title"
            >
              Calendar
            </h2>
            <p 
              className="text-muted-foreground mb-4"
              data-testid="calendar-card-description"
            >
              Schedule and organize your time efficiently
            </p>
            <Button 
              onClick={() => navigate("/calendar")} 
              variant="outline" 
              className="w-full"
              data-testid="calendar-nav-button"
              aria-label="View Calendar"
            >
              View Calendar
            </Button>
          </div>

          <div 
            className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
            data-testid="tasks-card"
          >
            <ListTodo className="w-12 h-12 text-primary mb-4" data-testid="tasks-icon" />
            <h2 
              className="text-2xl font-semibold mb-2"
              data-testid="tasks-card-title"
            >
              Tasks
            </h2>
            <p 
              className="text-muted-foreground mb-4"
              data-testid="tasks-card-description"
            >
              Manage your daily tasks and to-dos
            </p>
            <Button 
              onClick={() => navigate("/tasks")} 
              variant="outline" 
              className="w-full"
              data-testid="tasks-nav-button"
              aria-label="View Tasks"
            >
              View Tasks
            </Button>
          </div>

          <div 
            className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
            data-testid="projects-card"
          >
            <FileText className="w-12 h-12 text-primary mb-4" data-testid="projects-icon" />
            <h2 
              className="text-2xl font-semibold mb-2"
              data-testid="projects-card-title"
            >
              Projects
            </h2>
            <p 
              className="text-muted-foreground mb-4"
              data-testid="projects-card-description"
            >
              Track and manage your projects
            </p>
            <Button 
              onClick={() => navigate("/projects")} 
              variant="outline" 
              className="w-full"
              data-testid="projects-nav-button"
              aria-label="View Projects"
            >
              View Projects
            </Button>
          </div>
        </div>

        <div 
          className="mt-12 p-6 rounded-xl border bg-primary/5 text-center"
          data-testid="get-started-section"
        >
          <Star className="w-12 h-12 text-primary mx-auto mb-4" data-testid="get-started-icon" />
          <h2 
            className="text-2xl font-semibold mb-2"
            data-testid="get-started-title"
          >
            Get Started
          </h2>
          <p 
            className="text-muted-foreground mb-6 max-w-2xl mx-auto"
            data-testid="get-started-description"
          >
            Sign up now to unlock all features and start organizing your work with AI-powered insights
          </p>
          <div 
            className="flex gap-4 justify-center"
            data-testid="auth-buttons-container"
          >
            <Button 
              onClick={() => navigate("/auth/signup")} 
              size="lg"
              data-testid="signup-nav-button"
              aria-label="Sign Up"
            >
              Sign Up
            </Button>
            <Button 
              onClick={() => navigate("/auth/signin")} 
              variant="outline" 
              size="lg"
              data-testid="signin-nav-button"
              aria-label="Sign In"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
