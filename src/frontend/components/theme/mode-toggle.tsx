
// Copy content from the original mode-toggle.tsx
// For now, I'll create a placeholder that should be replaced with the actual content
import { Button } from "@/frontend/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/frontend/components/theme/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
