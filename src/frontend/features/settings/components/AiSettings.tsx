import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import { Loader2, InfoIcon, KeyIcon, ExternalLinkIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import { useToast } from "@/frontend/hooks/use-toast";
import { saveGeminiApiKey, getAiSettings, updateAiSettings } from "@/backend/api/services/ai/core/geminiService";

export default function AiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [currentApiKey, setCurrentApiKey] = useState<string | null>(null);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await getAiSettings();
        
        if (settings) {
          setCurrentApiKey(settings.gemini_api_key || null);
          setSuggestionsEnabled(settings.ai_suggestions_enabled !== false);
        }
      } catch (error) {
        console.error("Error loading AI settings:", error);
        toast({
          variant: "destructive",
          title: "Failed to load settings",
          description: "There was a problem loading your AI settings."
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSaveApiKey = async () => {
    try {
      setSaving(true);
      
      const success = await saveGeminiApiKey(apiKey, true); // Always use own key now
      
      if (success) {
        toast({
          title: "API key saved",
          description: "Your Gemini API key has been saved successfully."
        });
        
        setCurrentApiKey(apiKey);
        setApiKey("");
        setKeyVisible(false);
      } else {
        throw new Error("Failed to save API key");
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        variant: "destructive",
        title: "Failed to save API key",
        description: "There was a problem saving your Gemini API key."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuggestions = async (enabled: boolean) => {
    try {
      setSaving(true);
      setSuggestionsEnabled(enabled);
      
      const success = await updateAiSettings({
        ai_suggestions_enabled: enabled
      });
      
      if (success) {
        toast({
          title: `AI suggestions ${enabled ? 'enabled' : 'disabled'}`,
          description: `AI suggestions have been ${enabled ? 'enabled' : 'disabled'} successfully.`
        });
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating AI settings:", error);
      setSuggestionsEnabled(!enabled); // Revert UI state on error
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: "There was a problem updating your AI settings."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
          <CardDescription>
                          Configure how AI features work in your TaskPulse experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="suggestions">AI Suggestions</Label>
              <p className="text-sm text-muted-foreground">
                Allow the AI to suggest tasks and events based on your conversations
              </p>
            </div>
            <Switch
              id="suggestions"
              checked={suggestionsEnabled}
              onCheckedChange={handleToggleSuggestions}
              disabled={saving}
            />
          </div>
          
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>AI Features</AlertTitle>
            <AlertDescription>
              AI features allow you to chat with an assistant, get suggested tasks and events, and create items using natural language.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5" /> Gemini API Key 
            {!currentApiKey && <span className="text-sm font-medium text-destructive">(Required)</span>}
          </CardTitle>
          <CardDescription>
            You need to provide your own Google Gemini API key to use AI features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentApiKey ? (
            <Alert variant="success" className="bg-green-50 border-green-300 text-green-800">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>API Key Configured</AlertTitle>
              <AlertDescription>
                Your Gemini API key has been set up. You can update it below if needed.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                You need to add your own Gemini API key to use AI features. Chat and AI suggestions will not work until you add a key.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="apiKey">Your Gemini API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={keyVisible ? "text" : "password"}
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setKeyVisible(!keyVisible)}
                >
                  {keyVisible ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-4">
              <h4 className="text-sm font-medium mb-2">How to get your Gemini API key:</h4>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-4">
                <li>Visit <a href="https://ai.google.dev/" className="text-primary hover:underline inline-flex items-center" target="_blank" rel="noopener noreferrer">Google AI Studio <ExternalLinkIcon className="h-3 w-3 ml-1" /></a></li>
                <li>Sign in with your Google account</li>
                <li>Go to the API keys section</li>
                <li>Create a new API key</li>
                <li>Copy and paste it here</li>
              </ol>
              <p className="text-xs mt-2">Your API key is stored securely in your user settings.</p>
            </div>

            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Information</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Your API key is stored securely in the database.</li>
                  <li>You may be charged by Google based on your API usage.</li>
                  <li>API calls are made directly from your browser to Google.</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
          <CardFooter>
            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKey || saving}
              className="ml-auto"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save API Key
            </Button>
          </CardFooter>
      </Card>
    </div>
  );
} 