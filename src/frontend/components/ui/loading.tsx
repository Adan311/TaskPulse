import { Loader2 } from "lucide-react";

interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Loading = ({ 
  text = "Loading...", 
  size = "md",
  className = "" 
}: LoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`animate-spin text-muted-foreground ${sizeClasses[size]}`} />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
};

export const PageLoading = ({ text = "Loading page..." }: { text?: string }) => (
  <Loading text={text} size="lg" className="min-h-[400px]" />
);

export default Loading; 