
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, ListTodo, FileText, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { logout } from "@/lib/auth";

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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to TaskPulse</h1>
          <p className="text-xl text-muted-foreground">Your AI-powered productivity dashboard</p>
          <Button onClick={handleLogout} variant="outline" className="mt-4">
            Log Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <Calendar className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Calendar</h2>
            <p className="text-muted-foreground mb-4">Schedule and organize your time efficiently</p>
            <Button onClick={() => navigate("/calendar")} variant="outline" className="w-full">
              View Calendar
            </Button>
          </div>

          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <ListTodo className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Tasks</h2>
            <p className="text-muted-foreground mb-4">Manage your daily tasks and to-dos</p>
            <Button onClick={() => navigate("/tasks")} variant="outline" className="w-full">
              View Tasks
            </Button>
          </div>

          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <FileText className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Projects</h2>
            <p className="text-muted-foreground mb-4">Track and manage your projects</p>
            <Button onClick={() => navigate("/projects")} variant="outline" className="w-full">
              View Projects
            </Button>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl border bg-primary/5 text-center">
          <Star className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Get Started</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Sign up now to unlock all features and start organizing your work with AI-powered insights
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/auth/signup")} size="lg">
              Sign Up
            </Button>
            <Button onClick={() => navigate("/auth/signin")} variant="outline" size="lg">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
