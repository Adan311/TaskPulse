import React from "react";
import { Bell, Calendar, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Reminder } from "@/backend/api/services/reminder.service";

// Track recently shown reminders to avoid duplicates
const recentlyShownReminders = new Set<string>();

/**
 * Show a reminder notification
 */
export const showReminderNotification = (reminder: Reminder) => {
  const { id, title, type, description } = reminder;
  
  // Create a unique key for this reminder
  const reminderKey = `${id}-${type}`;
  
  // Check if we've shown this reminder in the last 30 seconds
  if (recentlyShownReminders.has(reminderKey)) {
    return; // Skip showing duplicate
  }
  
  // Add to recently shown set and remove after 30 seconds
  recentlyShownReminders.add(reminderKey);
  setTimeout(() => {
    recentlyShownReminders.delete(reminderKey);
  }, 30000);
  
  toast(
    <div className="flex gap-2">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-full">
        {type === "task" ? (
          <ClipboardList className="h-4 w-4 text-primary" />
        ) : (
          <Calendar className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium mb-0.5 line-clamp-1 dark:text-white">
          {type === "task" ? "Task Reminder: " : "Event Reminder: "}
          {title}
        </div>
        {description && (
          <div className="text-sm text-muted-foreground dark:text-gray-300 line-clamp-2">
            {description}
          </div>
        )}
      </div>
    </div>,
    {
      duration: 10000,
      icon: <Bell className="h-5 w-5" />,
      className: "dark:bg-gray-800 dark:text-white dark:border-gray-700",
      action: {
        label: "Dismiss",
        onClick: () => {
          toast.dismiss();
        },
      },
    }
  );
}; 