import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Index from "./frontend/pages/Index";
import NotFound from "./frontend/pages/NotFound";
import SignIn from "./frontend/pages/auth/SignIn";
import SignUp from "./frontend/pages/auth/SignUp";
import { GoogleCalendarCallback } from "./frontend/features/calendar/components/GoogleCalendarCallback";
import { PageLoading } from "./frontend/components/ui/loading";
import "./index.css";
import { ThemeProvider } from "./frontend/components/theme/theme-provider";
import { Toaster } from "./frontend/components/ui/toaster";
import { SidebarProvider } from "./frontend/components/ui/sidebar";
import { ReminderProvider } from "./frontend/components/ReminderProvider";

// Lazy load heavy/feature-rich pages for better performance
const Calendar = React.lazy(() => import("./frontend/pages/Calendar"));
const Tasks = React.lazy(() => import("./frontend/pages/Tasks"));
const Projects = React.lazy(() => import("./frontend/pages/Projects"));
const Files = React.lazy(() => import("./frontend/pages/Files"));
const Components = React.lazy(() => import("./frontend/pages/Components"));
const Timer = React.lazy(() => import("./frontend/pages/Timer"));
const NotesPage = React.lazy(() => import("./frontend/pages/Notes"));
const Settings = React.lazy(() => import("./frontend/pages/Settings"));
const ProjectDetailPage = React.lazy(() => import("./frontend/pages/ProjectDetailPage"));
const Chat = React.lazy(() => import("./frontend/pages/Chat"));
const Suggestions = React.lazy(() => import("./frontend/pages/Suggestions"));
const PrivacyPolicy = React.lazy(() => import("./frontend/pages/legal/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./frontend/pages/legal/TermsOfService"));

// Wrapper component for Suspense boundaries
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoading />}>
    {children}
  </Suspense>
);

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
        element: (
          <LazyWrapper>
            <Calendar />
          </LazyWrapper>
        ),
      },
      {
        path: "tasks",
        element: (
          <LazyWrapper>
            <Tasks />
          </LazyWrapper>
        ),
      },
      {
        path: "projects",
        element: (
          <LazyWrapper>
            <Projects />
          </LazyWrapper>
        ),
        children: [
          {
            path: ":id",
            element: (
              <LazyWrapper>
                <ProjectDetailPage />
              </LazyWrapper>
            ),
          },
        ],
      },
      {
        path: "files",
        element: (
          <LazyWrapper>
            <Files />
          </LazyWrapper>
        ),
      },
      {
        path: "components",
        element: (
          <LazyWrapper>
            <Components />
          </LazyWrapper>
        ),
      },
      {
        path: "timer",
        element: (
          <LazyWrapper>
            <Timer />
          </LazyWrapper>
        ),
      },
      {
        path: "settings",
        element: (
          <LazyWrapper>
            <Settings />
          </LazyWrapper>
        ),
      },
      {
        path: "notes",
        element: (
          <LazyWrapper>
            <NotesPage />
          </LazyWrapper>
        ),
      },
      {
        path: "chat",
        element: (
          <LazyWrapper>
            <Chat />
          </LazyWrapper>
        ),
      },
      {
        path: "chat/:conversationId",
        element: (
          <LazyWrapper>
            <Chat />
          </LazyWrapper>
        ),
      },
      {
        path: "suggestions",
        element: (
          <LazyWrapper>
            <Suggestions />
          </LazyWrapper>
        ),
      },
      {
        path: "privacy-policy",
        element: (
          <LazyWrapper>
            <PrivacyPolicy />
          </LazyWrapper>
        ),
      },
      {
        path: "terms-of-service",
        element: (
          <LazyWrapper>
            <TermsOfService />
          </LazyWrapper>
        ),
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
