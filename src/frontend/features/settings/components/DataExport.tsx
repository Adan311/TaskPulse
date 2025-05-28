import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Download, Loader2, FileText, Shield } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import { exportUserData, downloadDataAsJson } from "@/backend/api/services/gdpr/dataExportService";

const DataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      // Export user data and download as JSON
      const userData = await exportUserData();
      downloadDataAsJson(userData);
      
      toast({
        title: "Data export complete",
        description: "Your data has been exported and downloaded successfully.",
      });
    } catch (error) {
      console.error("Data export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your personal data in JSON format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>What's included in your export</AlertTitle>
            <AlertDescription>
              Your export will include: personal profile, tasks, events, notes, projects, files, 
              AI conversations, suggestions, and settings. This may take a few minutes to generate.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export My Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Rights
          </CardTitle>
          <CardDescription>
            Learn about your data rights and how to exercise them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">Under GDPR, you have the following rights:</p>
            <ul className="text-sm text-muted-foreground space-y-1 pl-4">
              <li>• <strong>Right to Access:</strong> Request a copy of your data (use export above)</li>
              <li>• <strong>Right to Rectification:</strong> Correct inaccurate data in your profile</li>
              <li>• <strong>Right to Erasure:</strong> Delete your account and all data</li>
              <li>• <strong>Right to Portability:</strong> Take your data with you</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExport; 