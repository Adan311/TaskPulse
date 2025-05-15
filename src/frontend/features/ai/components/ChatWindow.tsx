import { useState, useRef, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Loader2, Send, Plus, KeyIcon, ExternalLinkIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import { useToast } from "@/frontend/hooks/use-toast";
import { ChatMessage, sendMessage, createConversation, getConversation } from "@/backend/api/services/ai/chatService";
import { getAiSettings } from "@/backend/api/services/ai/geminiService";
import { useNavigate } from "react-router-dom";

interface ChatWindowProps {
  conversationId?: string;
  onNewConversation?: (conversationId: string) => void;
}

export function ChatWindow({ conversationId, onNewConversation }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user has API key
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const settings = await getAiSettings();
        setHasApiKey(!!settings?.gemini_api_key);
      } catch (error) {
        console.error("Error checking API key:", error);
        setHasApiKey(false);
      }
    };
    
    checkApiKey();
  }, []);
  
  // Effect to scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Load conversation history if conversationId provided
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        setInitialLoad(false);
        return;
      }
      
      try {
        setLoading(true);
        const conversation = await getConversation(conversationId);
        
        if (conversation) {
          setMessages(conversation.messages || []);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        toast({
          variant: "destructive",
          title: "Failed to load conversation",
          description: "There was a problem loading the conversation."
        });
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    
    loadConversation();
  }, [conversationId, toast]);
  
  const handleStartNewConversation = async () => {
    if (!hasApiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "You need to add your Gemini API key in settings first."
      });
      return;
    }
    
    try {
      setLoading(true);
      const conversation = await createConversation();
      
      if (conversation) {
        setMessages([]);
        if (onNewConversation) {
          onNewConversation(conversation.id);
        }
        toast({
          title: "New conversation started",
          description: "You've started a new conversation with the AI."
        });
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        variant: "destructive",
        title: "Failed to start conversation",
        description: "There was a problem starting a new conversation."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    if (!hasApiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "You need to add your Gemini API key in settings first."
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a new conversation if we don't have one
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const conversation = await createConversation();
        if (!conversation) {
          toast({
            variant: "destructive",
            title: "Conversation Error",
            description: "Failed to create a new conversation. Please try again."
          });
          return;
        }
        currentConversationId = conversation.id;
        if (onNewConversation) {
          onNewConversation(conversation.id);
        }
      }
      
      // Keep a copy of the message
      const userInputMessage = input;
      setInput("");
      
      // Add user message to UI immediately
      const tempUserMsg: ChatMessage = {
        id: 'temp-user-' + Date.now(),
        conversationId: currentConversationId,
        userId: 'current-user',
        content: userInputMessage,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempUserMsg]);
      
      // Send the message
      try {
        const result = await sendMessage(currentConversationId, userInputMessage);
        
        if (result) {
          // Replace the temporary message with the real one and add the AI response
          setMessages(prev => [
            ...prev.filter(msg => msg.id !== tempUserMsg.id),
            result.userMessage,
            result.aiMessage
          ]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        
        // Check if this is an API key error
        const errorMessage = error instanceof Error ? error.message : "Failed to get AI response";
        const isApiKeyError = errorMessage.includes("API key") || errorMessage.includes("settings");
        
        // Keep the user message but add an error message
        const errorMsg: ChatMessage = {
          id: 'error-' + Date.now(),
          conversationId: currentConversationId,
          userId: 'system',
          content: `Error: ${errorMessage}`,
          role: 'assistant',
          createdAt: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, errorMsg]);
        
        // If it's an API key error, update our state
        if (isApiKeyError) {
          setHasApiKey(false);
        }
        
        toast({
          variant: "destructive",
          title: "AI Response Error",
          description: errorMessage
        });
      }
    } catch (error) {
      console.error("Error in message flow:", error);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: error instanceof Error ? error.message : "There was a problem with your chat. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle keyboard shortcut (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleGoToSettings = () => {
    navigate("/settings");
  };
  
  if (initialLoad) {
    return (
      <Card className="w-full h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }
  
  const formatMessage = (message: ChatMessage) => {
    // Simple formatting - could be enhanced with markdown processing
    return message.content.split("\n").map((line, index) => (
      <p key={index} className={index > 0 ? "mt-2" : ""}>{line}</p>
    ));
  };
  
  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>AI Assistant</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleStartNewConversation}
            disabled={loading || hasApiKey === false}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {hasApiKey === false ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <Alert variant="destructive" className="mb-4">
              <KeyIcon className="h-4 w-4" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                You need to add your own Gemini API key to use the AI chat.
              </AlertDescription>
            </Alert>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">AI features require your own Google Gemini API key.</p>
              <div className="rounded-md bg-muted p-4 text-left">
                <h4 className="text-sm font-medium mb-2">How to get your API key:</h4>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-4">
                  <li>Visit <a href="https://ai.google.dev/" className="text-primary hover:underline inline-flex items-center" target="_blank" rel="noopener noreferrer">Google AI Studio <ExternalLinkIcon className="h-3 w-3 ml-1" /></a></li>
                  <li>Sign in with your Google account</li>
                  <li>Go to the API keys section</li>
                  <li>Create a new API key</li>
                </ol>
              </div>
              <Button onClick={handleGoToSettings}>
                Go to Settings
              </Button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
            <p className="mb-4">Ask me anything about your tasks, projects, or schedule.</p>
            <p className="text-sm">I can help you organize your work, manage your time, or brainstorm ideas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {formatMessage(message)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            placeholder={hasApiKey === false ? "Add your API key in settings to use AI chat" : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[60px] max-h-[120px]"
            disabled={loading || hasApiKey === false}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={loading || !input.trim() || hasApiKey === false}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 