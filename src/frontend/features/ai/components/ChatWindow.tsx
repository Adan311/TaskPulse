import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Loader2, Send, Plus, KeyIcon, ExternalLinkIcon, Lightbulb, User, Bot, RefreshCw, Settings, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import { useToast } from "@/frontend/hooks/use-toast";
import { ChatMessage, sendMessage, createConversation, getConversation } from "@/backend/api/services/ai/chat/chatService";
import { getAiSettings } from "@/backend/api/services/ai/core/geminiService";
import { getSuggestionCounts, requestSuggestions, ClarifyingQuestion } from "@/backend/api/services/ai/suggestions/suggestionService";
import { useNavigate } from "react-router-dom";
import SuggestionBadge from './SuggestionBadge';
import { MarkdownRenderer } from './MarkdownRenderer';
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "@/frontend/components/ui/sidebar/sidebar";
import { 
  validateUserInput, 
  getErrorMessageWithAction, 
  createErrorFromException,
  AIError 
} from "@/backend/api/services/ai/core/errorService";

interface ChatWindowProps {
  conversationId?: string;
  onNewConversation?: (conversationId: string) => void;
}

interface ErrorState {
  error: AIError | null;
  retryAction?: () => Promise<void>;
  showError: boolean;
}

export function ChatWindow({ conversationId, onNewConversation }: ChatWindowProps) {
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
          description: "You've started a new conversation with the AI."
        });
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (error) {
      handleError(error as Error, 'create_conversation', handleStartNewConversation);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    // Validate input first
    const inputValidation = validateUserInput(input);
    if (inputValidation) {
      setErrorState({
        error: inputValidation,
        showError: true
      });
      return;
    }
    
    if (!hasApiKey) {
      handleError('API key is required', 'send_message');
      return;
    }
    
    const retryFunction = async () => {
      return handleSendMessage();
    };
    
    try {
      setLoading(true);
      
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
          
          // Handle suggestions
          if (result.hasOverallSuggestions) {
            const newSuggestionsSet = new Set(messagesWithSuggestions);
            newSuggestionsSet.add(result.aiMessage.id);
            setMessagesWithSuggestions(newSuggestionsSet);
            await checkForSuggestions(); // Refresh suggestion counts
          }
          
          // Handle clarifying questions
          if (result.clarifyingQuestions && result.clarifyingQuestions.length > 0) {
            setClarifyingQuestions(result.clarifyingQuestions);
          }
          
          // Clear any previous errors
          setErrorState({ error: null, showError: false });
        } else {
          throw new Error("No response received from AI service");
        }
      } catch (error) {
        // Remove the temporary message and restore the input
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMsg.id));
        setInput(userInputMessage);
        throw error;
      }
    } catch (error) {
      handleError(error as Error, 'send_message', retryFunction);
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
  
  const checkForSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get current suggestion counts
      const counts = await getSuggestionCounts(user.id);
      setSuggestionCounts(counts);
      
      // If we have suggestions, update UI
      const totalSuggestions = counts.tasks + counts.events;
      
      // Log for debugging
      console.log(`Found ${totalSuggestions} suggestions: ${counts.tasks} tasks, ${counts.events} events`);
    } catch (error) {
      handleError(error as Error, 'check_suggestions');
    }
  };
  
  const handleGetSuggestions = async () => {
    if (!conversationId) {
      handleError('No conversation available', 'get_suggestions');
      return;
    }

    if (!hasApiKey) {
      handleError('API key is required', 'get_suggestions');
      return;
    }

    const retryFunction = async () => {
      return handleGetSuggestions();
    };

    try {
      setRequestingSuggestions(true);
      
      // Show toast to indicate we're analyzing the conversation
      toast({
        title: "Analyzing conversation",
        description: "Looking for potential tasks and events...",
      });
      
      const result = await requestSuggestions(conversationId);
      
      if (result.hasSuggestions) {
        toast({
          title: "Suggestions Found!",
          description: "New suggestions have been identified from your conversation. Check the Suggestions page to review them.",
        });
        
        // Update suggestion counts
        await checkForSuggestions();
        
        // Clear any previous errors
        setErrorState({ error: null, showError: false });
      } else {
        toast({
          title: "No Suggestions Found",
          description: "No tasks or events were identified in your conversation.",
        });
      }
    } catch (error) {
      handleError(error as Error, 'get_suggestions', retryFunction);
    } finally {
      setRequestingSuggestions(false);
    }
  };
  
  const handleViewSuggestions = () => {
    navigate("/suggestions");
  };
  
  if (initialLoad) {
    return (
      <div className={`p-4 ${isCollapsed ? 'ml-16' : 'ml-64'} h-screen flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const formatMessage = (message: ChatMessage) => {
    // Enhanced formatting with markdown processing
    if (message.role === 'assistant') {
      return <MarkdownRenderer content={message.content} />;
    }
    // For user messages, keep simple formatting
    return message.content.split("\n").map((line, index) => (
      <p key={index} className={index > 0 ? "mt-2" : ""}>{line}</p>
    ));
  };
  
  const renderMessages = () => {
    return messages.map((message) => (
      <div
        key={message.id}
        className={`flex ${
          message.role === "user" ? "justify-end" : "justify-start"
        } mb-4`}
      >
        {message.role !== "user" && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        )}
        <div
          className={`rounded-lg px-4 py-3 max-w-[80%] ${
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-accent/30"
          } shadow-sm`}
        >
          {formatMessage(message)}
          {messagesWithSuggestions.has(message.id) && (
            <SuggestionBadge messageId={message.id} />
          )}
        </div>
        {message.role === "user" && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ml-2">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
    ));
  };
  
  const totalSuggestions = suggestionCounts.tasks + suggestionCounts.events;
  
  return (
    <div className={`flex flex-col h-screen ${isCollapsed ? 'ml-16' : 'ml-64'} p-4`}>
      <div className="flex justify-between items-center mb-4 p-2 border-b">
        <h2 className="text-xl font-semibold">AI Assistant</h2>
        <div className="flex space-x-2">
          {totalSuggestions > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewSuggestions}
              className="flex items-center"
            >
              <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
              View Suggestions
              <span className="ml-1 bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {totalSuggestions}
              </span>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGetSuggestions}
            disabled={loading || requestingSuggestions || hasApiKey === false || !conversationId || messages.length === 0}
            className="flex items-center"
          >
            {requestingSuggestions ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4 mr-2" />
            )}
            Get Suggestions
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleStartNewConversation}
            disabled={loading || hasApiKey === false}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Error Display */}
      {errorState.showError && errorState.error && (
        <div className="mb-4">
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
      
      <div className="flex-1 overflow-y-auto mb-4 rounded-lg bg-background/50 p-4">
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
          <div className="space-y-2">
            {renderMessages()}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="sticky bottom-0 bg-background p-3 border rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <Textarea
            placeholder={hasApiKey === false ? "Add your API key in settings to use AI chat" : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[60px] max-h-[120px] border focus:ring-1 focus:ring-primary"
            disabled={loading || hasApiKey === false}
          />
          <Button 
            size="icon"
            onClick={handleSendMessage} 
            disabled={loading || !input.trim() || hasApiKey === false}
            className="h-10 w-10 rounded-full"
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