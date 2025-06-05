import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { ChatWindow } from "@/frontend/features/ai/components/ChatWindow";
import { Button } from "@/frontend/components/ui/button";
import { Plus, Loader2, Trash2, MessageCircle, Clock } from "lucide-react";
import { getConversations, ChatConversation, createConversation, deleteConversation } from "@/backend/api/services/ai/chat/chatService";
import { useToast } from "@/frontend/hooks/use-toast";

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load conversations. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, [toast]);
  
  const handleNewConversation = async () => {
    try {
      setLoading(true);
      const conversation = await createConversation();
      
      if (conversation) {
        navigate(`/chat/${conversation.id}`);
        setConversations(prev => [conversation, ...prev]);
        toast({
          title: "New Conversation",
          description: "Started a new conversation."
        });
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create a new conversation. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteConversation = async (id: string) => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      const success = await deleteConversation(id);
      
      if (success) {
        // Remove from state
        setConversations(prev => prev.filter(conv => conv.id !== id));
        
        // Navigate to another conversation or the base chat route
        if (conversationId === id) {
          const nextConversation = conversations.find(conv => conv.id !== id);
          if (nextConversation) {
            navigate(`/chat/${nextConversation.id}`);
          } else {
            navigate('/chat');
          }
        }
        
        toast({
          title: "Conversation Deleted",
          description: "The conversation has been deleted."
        });
      } else {
        throw new Error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the conversation. Please try again."
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };
  
  const handleConversationUpdate = (id: string) => {
    // Refresh the conversations list
    getConversations().then(data => {
      setConversations(data);
    }).catch(error => {
      console.error("Error refreshing conversations:", error);
    });
    
    // When a conversation is created or updated, make sure we're on the right URL
    if (conversationId !== id) {
      navigate(`/chat/${id}`);
    }
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return messageDate.toLocaleDateString();
  };
  
  return (
    <AppLayout>
      <div className="flex h-screen bg-background">
        {/* Modern Sidebar */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
              </div>
            </div>
            
            <Button
              onClick={handleNewConversation}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Chat
            </Button>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium mb-2">No conversations yet</p>
                <p className="text-sm text-muted-foreground">Start a new conversation to begin chatting with AI</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer hover:bg-accent/50 hover:scale-[1.02] hover:shadow-sm ${
                    conversationId === conversation.id
                      ? "bg-primary/10 border-l-4 border-primary shadow-sm"
                      : "bg-card/50 hover:bg-accent/80"
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {conversation.title || "New Conversation"}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(conversation.updatedAt)}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                      disabled={isDeleting}
                      title="Delete conversation"
                    >
                      {isDeleting && conversation.id === conversationId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatWindow 
            conversationId={conversationId}
            onNewConversation={handleConversationUpdate}
          />
        </div>
      </div>
    </AppLayout>
  );
} 