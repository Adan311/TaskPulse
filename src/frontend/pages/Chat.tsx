import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { ChatWindow } from "@/frontend/features/ai/components/ChatWindow";
import { Button } from "@/frontend/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { getConversations, ChatConversation, createConversation } from "@/backend/api/services/ai/chatService";

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, []);
  
  const handleNewConversation = async () => {
    try {
      setLoading(true);
      const conversation = await createConversation();
      
      if (conversation) {
        navigate(`/chat/${conversation.id}`);
        setConversations(prev => [conversation, ...prev]);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };
  
  const handleConversationUpdate = (id: string) => {
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
                    className={`cursor-pointer p-3 rounded-md transition-colors ${
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