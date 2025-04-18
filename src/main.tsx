
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Index from "./frontend/pages/Index";
import Calendar from "./frontend/pages/Calendar";
import Tasks from "./frontend/pages/Tasks";
import Projects from "./frontend/pages/Projects";
import NotFound from "./frontend/pages/NotFound";
import Components from "./frontend/pages/Components";
import Timer from "./frontend/pages/Timer";
import SignIn from "./frontend/pages/auth/SignIn";
import SignUp from "./frontend/pages/auth/SignUp";
import "./index.css";
import { ThemeProvider } from "./frontend/components/theme/theme-provider";
import { Toaster } from "./frontend/components/ui/toaster";
import { GoogleCalendarCallback } from "./frontend/features/calendar/components/GoogleCalendarCallback";

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
      },
      {
        path: "components",
        element: <Components />,
      },
      {
        path: "timer",
        element: <Timer />,
      },
    ],
  },
  {
    path: "/auth/sign-in",
    element: <SignIn />,
  },
  {
    path: "/auth/sign-up",
    element: <SignUp />,
  },
  {
    path: "/calendar/google-callback",
    element: <GoogleCalendarCallback />,
  },
  // Add the routes that were in App.tsx BrowserRouter
  {
    path: "/auth/signin",
    element: <SignIn />,
  },
  {
    path: "/auth/signup",
    element: <SignUp />,
  },
  {
    path: "/api/google-calendar-callback",
    element: <GoogleCalendarCallback />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>
);
