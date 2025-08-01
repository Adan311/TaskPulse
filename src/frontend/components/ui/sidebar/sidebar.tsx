// Basic sidebar implementation for the application
import * as React from "react";
import { cn } from "@/frontend/lib/utils";

// Context for managing sidebar state
type SidebarContextType = {
  state: "expanded" | "collapsed";
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

// Provider for sidebar state
export function SidebarProvider({
  children,
  defaultState = "expanded",
}: {
  children: React.ReactNode;
  defaultState?: "expanded" | "collapsed";
}) {
  const [state, setState] = React.useState<"expanded" | "collapsed">(defaultState);

  const toggleSidebar = React.useCallback(() => {
    setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  }, []);

  const value = React.useMemo(
    () => ({
      state,
      toggleSidebar,
    }),
    [state, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

// Hook for accessing sidebar state
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// Main sidebar component
export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  
  return (
    <div
      ref={ref}
      data-state={state}
      className={cn(
        // Collapsed: w-14 (for icons), Expanded: w-56 (was w-64)
        "group fixed inset-y-0 left-0 z-30 flex h-full flex-col border-r bg-background transition-all duration-300 data-[state=collapsed]:w-14 data-[state=expanded]:w-56",
        className
      )}
      {...props}
    />
  );
});
Sidebar.displayName = "Sidebar";

// Sidebar header component
export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-14 items-center border-b px-4", className)}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

// Sidebar content component
export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto py-2", className)}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

// Sidebar footer component
export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-auto", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

// Sidebar group component
export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-2", className)}
    {...props}
  />
));
SidebarGroup.displayName = "SidebarGroup";

// Sidebar group label component
export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar();
  
  return (
    <div
      ref={ref}
      className={cn(
        "px-4 py-1 text-xs font-semibold text-muted-foreground transition-all group-[[data-state=collapsed]]:opacity-0",
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

// Sidebar group content component
export const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-1", className)}
    {...props}
  />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

// Sidebar menu component
export const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-1 px-2", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

// Sidebar menu item component
export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("list-none", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

// Sidebar menu button component
export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tooltip?: string;
    asChild?: boolean;
  }
>(({ className, asChild = false, tooltip, children, ...props }, ref) => {
  const { state } = useSidebar();
  
  if (asChild) {
    // If asChild is true, we just pass the appropriate props to the children
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
      className: cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      ),
      title: state === "collapsed" ? tooltip : undefined,
      ref,
      ...props
    });
  }
  
  return (
    <button
      ref={ref}
      title={state === "collapsed" ? tooltip : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

// Sidebar trigger component
export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  
  return (
    <button
      ref={ref}
      onClick={toggleSidebar}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

// Additional components needed for completeness
export const SidebarGroupAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-4", className)}
    {...props}
  />
));
SidebarGroupAction.displayName = "SidebarGroupAction";

export const SidebarInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
SidebarInput.displayName = "SidebarInput";

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-4 px-4", className)}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";

export const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "ml-auto opacity-0 group-hover:opacity-100",
      className
    )}
    {...props}
  />
));
SidebarMenuAction.displayName = "SidebarMenuAction";

export const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground",
      className
    )}
    {...props}
  />
));
SidebarMenuBadge.displayName = "SidebarMenuBadge";

export const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-9 items-center gap-2 rounded-md px-3 py-2",
      className
    )}
    {...props}
  >
    <div className="h-4 w-4 rounded-sm bg-muted" />
    <div className="h-3 w-24 rounded-sm bg-muted" />
  </div>
));
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

export const SidebarMenuSub = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-1", className)}
    {...props}
  />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

export const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  />
));
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("list-none", className)}
    {...props}
  />
));
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

export const SidebarRail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-y-0 left-0 z-30 flex h-full w-14 flex-col border-r bg-background",
      className
    )}
    {...props}
  />
));
SidebarRail.displayName = "SidebarRail";

export const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mx-3 my-1 h-px bg-border", className)}
    {...props}
  />
));
SidebarSeparator.displayName = "SidebarSeparator";
