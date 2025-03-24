
// Copy the content from the original app-sidebar.tsx file
// For now, I'll create a placeholder that should be replaced with the actual content
import { SidebarNav } from "@/frontend/components/ui/sidebar";
import { Home, Calendar, Clock, ListTodo, FileText, User } from "lucide-react";

export function AppSidebar() {
  const items = [
    {
      title: "Home",
      href: "/",
      icon: Home,
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: Calendar,
    },
    {
      title: "Timer",
      href: "/timer",
      icon: Clock,
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: ListTodo,
    },
    {
      title: "Projects",
      href: "/projects",
      icon: FileText,
    },
  ];

  return <SidebarNav items={items} />;
}
