import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Loader2, Send, Plus, KeyIcon, ExternalLinkIcon, Lightbulb, User, Bot, RefreshCw, Settings, AlertTriangle, Sparkles, Zap, Minimize2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import { useToast } from "@/frontend/hooks/use-toast";
import { ChatMessage, sendMessage, createConversation, getConversation, ClarifyingQuestion } from "@/backend/api/services/ai/chat/chatService";
import { getAiSettings } from "@/backend/api/services/ai/core/geminiService";
import { getSuggestionCounts, requestSuggestions } from "@/backend/api/services/ai/suggestions/suggestionService";
import { useNavigate } from "react-router-dom";
import SuggestionBadge from './SuggestionBadge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { supabase } from "@/backend/database/client";
import { useSidebar } from "@/frontend/components/ui/sidebar/sidebar";
import { 
  validateUserInput, 
  getErrorMessageWithAction, 
  createErrorFromException,
  AIError 
} from "@/backend/api/services/ai/core/errorService";

// Auto-expanding textarea component
interface AutoExpandingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
}

const AutoExpandingTextarea = React.forwardRef<HTMLTextAreaElement, AutoExpandingTextareaProps>(
  ({ maxRows = 5, className, onChange, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const combinedRef = ref || textareaRef;

    const adjustHeight = () => {
      const textarea = typeof combinedRef === 'function' ? textareaRef.current : combinedRef?.current;
      if (textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Calculate the line height
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20;
        const maxHeight = lineHeight * maxRows;
        
        // Set the height to either scrollHeight or maxHeight, whichever is smaller
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        
        // Enable scrolling if content exceeds maxRows
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onChange) {
        onChange(e);
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value]);

    return (
      <textarea
        ref={combinedRef}
        className={`min-h-[40px] ${className}`}
        onChange={handleChange}
        rows={1}
        {...props}
      />
    );
  }
);

AutoExpandingTextarea.displayName = "AutoExpandingTextarea";

interface ChatWindowProps {
  conversationId?: string;
  onNewConversation?: (conversationId: string) => void;
  onCollapse?: () => void;
}

interface ErrorState {
  error: AIError | null;
  retryAction?: () => Promise<void>;
  showError: boolean;
}

export function ChatWindow({ conversationId, onNewConversation, onCollapse }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [requestingSuggestions, setRequestingSuggestions] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState>({ error: null, showError: false });
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messagesWithSuggestions, setMessagesWithSuggestions] = useState<Set<string>>(new Set());
  const [suggestionCounts, setSuggestionCounts] = useState<{tasks: number; events: number}>({tasks: 0, events: 0});
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([]);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Enhanced error handling helper
  const handleError = (error: Error | string, operation: string, retryAction?: () => Promise<void>) => {
    const aiError = createErrorFromException(error, operation, {
      userId: 'current-user',
      conversationId: conversationId
    });
    
    setErrorState({
      error: aiError,
      retryAction,
      showError: true
    });
    
    const errorInfo = getErrorMessageWithAction(aiError);
    
    // Show toast notification
    toast({
      variant: "destructive",
      title: "Error",
      description: errorInfo.message,
      action: errorInfo.action ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleErrorAction(errorInfo.actionType!, retryAction)}
        >
          {errorInfo.action}
        </Button>
      ) : undefined
    });
  };
  
  // Handle error action buttons
  const handleErrorAction = async (actionType: string, retryAction?: () => Promise<void>) => {
    switch (actionType) {
      case 'retry':
        if (retryAction) {
          setErrorState(prev => ({ ...prev, showError: false }));
          try {
            await retryAction();
          } catch (error) {
            handleError(error as Error, 'retry_operation');
          }
        }
        break;
      case 'navigate':
        if (errorState.error?.code === 'API_KEY_MISSING' || errorState.error?.code === 'API_KEY_INVALID') {
          navigate('/settings');
        } else if (errorState.error?.code === 'AUTH_NO_USER') {
          navigate('/auth/login');
        }
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'contact':
        // You could implement a support contact form here
        toast({
          title: "Contact Support",
          description: "Please contact our support team for assistance."
        });
        break;
    }
  };
  
  // Dismiss error
  const dismissError = () => {
    setErrorState({ error: null, showError: false });
  };
  
  // Check if user has API key
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const settings = await getAiSettings();
        setHasApiKey(!!settings?.gemini_api_key);
      } catch (error) {
        handleError(error as Error, 'check_api_key');
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
          await checkForSuggestions();
        }
      } catch (error) {
        handleError(error as Error, 'load_conversation', () => loadConversation());
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    
    loadConversation();
  }, [conversationId]);
  
  // Check for suggestion updates periodically
  useEffect(() => {
    if (!conversationId) return;
    
    // Initial check
    checkForSuggestions();
    
    // Set up interval to check for suggestion updates
    const interval = setInterval(() => {
      checkForSuggestions();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [conversationId]);
  
  const handleStartNewConversation = async () => {
    if (!hasApiKey) {
      handleError('API key is required', 'start_conversation');
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
          description: "Ready to chat!"
        });
      }
    } catch (error) {
      handleError(error as Error, 'create_conversation', () => handleStartNewConversation());
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || loading || !hasApiKey) {
      return;
    }
    
    const messageContent = input.trim();
    
    // Validate input
    const validationError = validateUserInput(messageContent);
    if (validationError) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: validationError.userMessage
      });
      return;
    }
    
    setInput("");
    
    const retryFunction = async () => {
      // Define userMessage outside the try block so it's accessible in catch
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conversationId: conversationId || "",
        userId: "current-user",
        content: messageContent,
        role: "user",
        createdAt: new Date().toISOString()
      };
      
      try {
        setLoading(true);
        
        // Add user message to state immediately for better UX
        setMessages(prev => [...prev, userMessage]);
        
        // Create a new conversation if we don't have one
        let currentConversationId = conversationId;
        if (!currentConversationId) {
          const conversation = await createConversation();
          if (!conversation) {
            throw new Error("Failed to create a new conversation");
          }
          currentConversationId = conversation.id;
          if (onNewConversation) {
            onNewConversation(conversation.id);
          }
        }
        
        const result = await sendMessage(currentConversationId, messageContent);
        
        if (result) {
          // Replace the temporary message with the actual ones from the server
          setMessages(prev => [
            ...prev.filter(msg => msg.id !== userMessage.id),
            result.userMessage,
            result.aiMessage
          ]);
          
          // Check for new suggestions after message is sent
          await checkForSuggestions();
          
          // Handle clarifying questions if any
          if (result.clarifyingQuestions && result.clarifyingQuestions.length > 0) {
            setClarifyingQuestions(result.clarifyingQuestions);
          }
          
          // Trigger conversation list refresh after a delay to allow title generation
          setTimeout(() => {
            if (onNewConversation && currentConversationId) {
              onNewConversation(currentConversationId);
            }
          }, 2000);
        }
      } catch (error) {
        // Remove the temporary user message on error
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        setInput(messageContent); // Restore input
        throw error; 
      } finally {
        setLoading(false);
      }
    };
    
    try {
      await retryFunction();
    } catch (error) {
      handleError(error as Error, 'send_message', retryFunction);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleGoToSettings = () => {
    navigate("/settings");
  };
  
  const checkForSuggestions = async () => {
    if (!conversationId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const counts = await getSuggestionCounts(user.id);
      const previousCounts = suggestionCounts.tasks + suggestionCounts.events;
      const newCounts = counts.tasks + counts.events;
      
      setSuggestionCounts(counts);
      
      // Only mark messages with suggestions if there are NEW suggestions

      if (newCounts > previousCounts && newCounts > 0) {
        // Find the last AI message manually (since findLast isn't available)
        let lastAiMessage = null;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'assistant') {
            lastAiMessage = messages[i];
            break;
          }
        }
        if (lastAiMessage) {
          setMessagesWithSuggestions(prev => new Set([...prev, lastAiMessage.id]));
        }
      }
    } catch (error) {
      console.error("Error checking suggestions:", error);
    }
  };
  
  const handleGetSuggestions = async () => {
    if (!conversationId || requestingSuggestions) return;
    
    setRequestingSuggestions(true);
    
    const retryFunction = async () => {
      try {
        const result = await requestSuggestions(conversationId);
        
        if (result.hasSuggestions) {
          toast({
            title: "Suggestions Generated",
            description: "New suggestions have been found from your conversation."
          });
          
          // Refresh suggestion counts
          await checkForSuggestions();
        } else {
          toast({
            title: "No Suggestions Found",
            description: "No tasks or events were identified in your conversation."
          });
        }
      } catch (error) {
        throw error;
      } finally {
        setRequestingSuggestions(false);
      }
    };
    
    try {
      await retryFunction();
    } catch (error) {
      handleError(error as Error, 'generate_suggestions', retryFunction);
      setRequestingSuggestions(false);
    }
  };
  
  const handleViewSuggestions = () => {
    navigate('/suggestions');
  };
  
  const formatMessage = (message: ChatMessage) => {
    if (message.role === 'assistant') {
      return <MarkdownRenderer content={message.content} />;
    }
    
    // For user messages, just render with line breaks
    return message.content.split("\n").map((line, index) => (
      <p key={index} className={index > 0 ? "mt-2" : ""}>{line}</p>
    ));
  };
  
  const renderMessages = () => {
    return messages.map((message, index) => (
      <div
        key={message.id}
        className={`flex items-start gap-3 mb-6 animate-in slide-in-from-bottom-2 duration-300 ${
          message.role === "user" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.role === "user" 
            ? "bg-muted border border-border text-foreground" 
            : "bg-gradient-to-br from-violet-500 to-purple-600 text-white dark:from-violet-400 dark:to-purple-500"
        }`}>
          {message.role === "user" ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>
        
        {/* Message Bubble */}
        <div className={`max-w-[70%] ${message.role === "user" ? "text-right" : "text-left"}`}>
          <div
            className={`rounded-2xl px-4 py-3 shadow-sm ${
              message.role === "user"
                ? "bg-muted/50 border border-border text-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {formatMessage(message)}
            {messagesWithSuggestions.has(message.id) && (
              <div className="mt-2">
                <SuggestionBadge messageId={message.id} />
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs text-muted-foreground mt-1 ${
            message.role === "user" ? "text-right" : "text-left"
          }`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    ));
  };
  
  const totalSuggestions = suggestionCounts.tasks + suggestionCounts.events;
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Modern Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-400 dark:to-purple-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {totalSuggestions > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewSuggestions}
                className="relative bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-yellow-100"
              >
                <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                View Suggestions
                <span className="ml-1 bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                  {totalSuggestions}
                </span>
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleStartNewConversation}
              disabled={loading || hasApiKey === false}
              className="hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {onCollapse && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onCollapse}
                className="hover:bg-primary/10"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Error Display */}
      {errorState.showError && errorState.error && (
        <div className="p-4">
          <Alert variant="destructive" className="relative">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              Error
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissError}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p>{errorState.error.userMessage}</p>
                <div className="flex space-x-2">
                  {errorState.error.retryable && errorState.retryAction && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleErrorAction('retry', errorState.retryAction)}
                      className="flex items-center"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Try Again
                    </Button>
                  )}
                  {(errorState.error.code === 'API_KEY_MISSING' || errorState.error.code === 'API_KEY_INVALID') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleErrorAction('navigate')}
                      className="flex items-center"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Go to Settings
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {hasApiKey === false ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center mx-auto mb-6">
                <KeyIcon className="h-8 w-8 text-amber-600" />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">API Key Required</h3>
              <p className="text-muted-foreground mb-6">
                You need to add your own Gemini API key to use the AI chat features.
              </p>
              
              <div className="rounded-xl bg-muted/50 p-4 text-left mb-6">
                <h4 className="text-sm font-medium mb-3">How to get your API key:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
                  <li>Visit <a href="https://ai.google.dev/" className="text-primary hover:underline inline-flex items-center" target="_blank" rel="noopener noreferrer">Google AI Studio <ExternalLinkIcon className="h-3 w-3 ml-1" /></a></li>
                  <li>Sign in with your Google account</li>
                  <li>Go to the API keys section</li>
                  <li>Create a new API key</li>
                </ol>
              </div>
              
              <Button onClick={handleGoToSettings} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Go to Settings
              </Button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
              <Bot className="h-10 w-10 text-violet-600" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Ready to help!</h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              Ask me anything about your tasks, projects, or schedule. I can help you organize your work, manage your time, or brainstorm ideas.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              <div 
                className="p-3 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted/70 transition-colors flex items-center gap-2"
                onClick={() => setInput("Help me plan my week")}
              >
                <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                <span>"Help me plan my week"</span>
              </div>
              <div 
                className="p-3 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted/70 transition-colors flex items-center gap-2"
                onClick={() => setInput("Suggest tasks for my project")}
              >
                <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>"Suggest tasks for my project"</span>
              </div>
              <div 
                className="p-3 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted/70 transition-colors flex items-center gap-2"
                onClick={() => setInput("Create a task to review documentation")}
              >
                <Plus className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>"Create task to review documentation"</span>
              </div>
              <div 
                className="p-3 rounded-lg bg-muted/50 text-sm cursor-pointer hover:bg-muted/70 transition-colors flex items-center gap-2"
                onClick={() => setInput("Update me on my projects")}
              >
                <RefreshCw className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>"Update me on my projects"</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {renderMessages()}
            {loading && (
              <div className="flex items-start gap-3 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Modern Input Area */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-end gap-3 w-full max-w-none">
          <div className="flex-1 min-w-0">
            <AutoExpandingTextarea
              placeholder={hasApiKey === false ? "Add your API key in settings to use AI chat" : "Type your message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || hasApiKey === false}
              maxRows={15}
              className="w-full resize-none rounded-2xl border-2 border-muted focus:border-primary/50 bg-background/50 px-3 py-2 text-sm transition-all duration-200"
            />
          </div>
          
          <Button 
            size="icon"
            onClick={handleSendMessage} 
            disabled={loading || !input.trim() || hasApiKey === false}
            className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 