import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { ChatWindow } from "@/frontend/features/ai/components/ChatWindow";
import { Button } from "@/frontend/components/ui/button";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { getConversations, ChatConversation, createConversation, deleteConversation } from "@/backend/api/services/ai/chatService";
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
  
  return (
    <AppLayout>
      <div className="container p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar with conversation list */}
          <div className="w-full md:w-64 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <Button
                size="sm"
                onClick={handleNewConversation}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                New
              </Button>
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-[600px]">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start a new conversation to begin</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between"
                  >
                    <div
                      className={`cursor-pointer p-3 rounded-md transition-colors flex-1 ${
                        conversationId === conversation.id
                          ? "bg-primary/20"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <h3 className="font-medium truncate">{conversation.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-1"
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
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Main chat area */}
          <div className="flex-1">
            <ChatWindow 
              conversationId={conversationId}
              onNewConversation={handleConversationUpdate}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 