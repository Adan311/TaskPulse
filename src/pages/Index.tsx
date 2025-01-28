import { AppLayout } from "@/components/AppLayout";

const Index = () => {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Welcome to Motion</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Tasks</h2>
            <p className="text-muted-foreground">Manage your daily tasks and to-dos</p>
          </div>
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Calendar</h2>
            <p className="text-muted-foreground">Schedule and organize your time</p>
          </div>
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Projects</h2>
            <p className="text-muted-foreground">Track and manage your projects</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;