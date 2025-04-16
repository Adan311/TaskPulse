import { useState, useEffect } from "react";
import { TaskBoard } from "@/frontend/features/tasks/components/TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/frontend/components/ui/button";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { useToast } from "@/frontend/hooks/use-toast";

const Tasks = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("User error:", error);
          toast({
            title: "Authentication error",
            description: "Failed to get user information",
            variant: "destructive",
          });
        }
        
        setUser(data.user);
        setLoading(false);
      } catch (error) {
        console.error("Error checking user:", error);
        setLoading(false);
      }
    };
    
    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center p-6 h-64">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view and manage your tasks.</p>
            <Button asChild>
              <a href="/auth/SignIn">Sign In</a>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <TaskBoard />
      </div>
    </AppLayout>
  );
};

export default Tasks;
