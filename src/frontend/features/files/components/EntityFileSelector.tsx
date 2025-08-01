import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";
import { Button } from "@/frontend/components/ui/button";
import { PlusIcon, MinusIcon } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface EntityFileSelectorProps {
  entityId?: string;
  entityType: 'project' | 'task' | 'event';
  title?: string;
  className?: string;
  compact?: boolean;
}

export function EntityFileSelector({
  entityId,
  entityType,
  title = "Files",
  className,
  compact = false
}: EntityFileSelectorProps) {
  const [showUpload, setShowUpload] = useState(false);

  if (!entityId) {
    return null;
  }

  const entityParams = {
    ...(entityType === 'project' && { project_id: entityId }),
    ...(entityType === 'task' && { task_id: entityId }),
    ...(entityType === 'event' && { event_id: entityId })
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className={cn("px-4", compact && "py-2")}>
        <div className="flex justify-between items-center">
          <CardTitle className={cn("text-base", compact && "text-sm")}>
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
            className="h-7 w-7 p-0"
          >
            {showUpload ? (
              <MinusIcon className="h-4 w-4" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn("px-4 pb-4", compact && "pt-0")}>
        {showUpload && (
          <div className="mb-4">
            <FileUpload
              {...entityParams}
              onUploadComplete={() => setShowUpload(false)}
            />
          </div>
        )}
        <FileList 
          {...entityParams}
          showPreview={true}
        />
      </CardContent>
    </Card>
  );
} 