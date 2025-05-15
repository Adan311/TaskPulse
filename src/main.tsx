import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Index from "./frontend/pages/Index";
import Calendar from "./frontend/pages/Calendar";
import Tasks from "./frontend/pages/Tasks";
import Projects from "./frontend/pages/Projects";
import Files from "./frontend/pages/Files";
import NotFound from "./frontend/pages/NotFound";
import Components from "./frontend/pages/Components";
import Timer from "./frontend/pages/Timer";
import SignIn from "./frontend/pages/auth/SignIn";
import SignUp from "./frontend/pages/auth/SignUp";
import NotesPage from "./frontend/pages/Notes";
import Settings from "./frontend/pages/Settings";
import ProjectDetailPage from "./frontend/pages/ProjectDetailPage";
import Chat from "./frontend/pages/Chat";
import "./index.css";
import { ThemeProvider } from "./frontend/components/theme/theme-provider";
import { Toaster } from "./frontend/components/ui/toaster";
import { GoogleCalendarCallback } from "./frontend/features/calendar/components/GoogleCalendarCallback";
import { SidebarProvider } from "./frontend/components/ui/sidebar";
import { ReminderProvider } from "./frontend/components/ReminderProvider";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "calendar",
        element: <Calendar />,
      },
      {
        path: "tasks",
        element: <Tasks />,
      },
      {
        path: "projects",
        element: <Projects />,
        children: [
          {
            path: ":id",
            element: <ProjectDetailPage />,
          },
        ],
      },
      {
        path: "files",
        element: <Files />,
      },
      {
        path: "components",
        element: <Components />,
      },
      {
        path: "timer",
        element: <Timer />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "notes",
        element: <NotesPage />,
      },
      {
        path: "chat",
        element: <Chat />,
        children: [
          {
            path: ":conversationId",
            element: <Chat />,
          },
        ],
      },
    ],
  },
  {
    path: "/auth/signin",
    element: <SignIn />,
  },
  {
    path: "/auth/signup",
    element: <SignUp />,
  },
  {
    path: "/calendar/google-callback",
    element: <GoogleCalendarCallback />,
  },
]);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SidebarProvider>
        <ReminderProvider>
          <RouterProvider router={router} />
          <Toaster />
        </ReminderProvider>
      </SidebarProvider>
    </ThemeProvider>
  </React.StrictMode>
);
