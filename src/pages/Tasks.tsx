
import { useState, useEffect } from "react";
import { TaskBoard } from "@/components/Tasks/TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";

const Tasks = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    
    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
