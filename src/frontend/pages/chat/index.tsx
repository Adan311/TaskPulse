import { useState, useEffect } from "react";
import { ChatWindow } from "@/frontend/features/ai/components/ChatWindow";
import { useToast } from "@/frontend/hooks/use-toast";
import { getConversations } from "@/backend/api/services/ai/chatService";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Plus } from "lucide-react";

export default function Chat() {
  const [conversations, setConversations] = useState<Array<{id: string, title: string}>>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load conversations on page load
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const conversationsList = await getConversations();
        setConversations(conversationsList.map(c => ({ 
          id: c.id, 
          title: c.title 
        })));
        
        // Set the active conversation to the most recent one if available
        if (conversationsList.length > 0) {
          setActiveConversationId(conversationsList[0].id);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast({
          variant: "destructive",
          title: "Failed to load conversations",
          description: "There was a problem loading your chat history."
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, [toast]);

  const handleNewConversation = (conversationId: string) => {
    // Add the new conversation to the list
    setConversations(prev => [
      // Add a placeholder until we refresh
      { id: conversationId, title: "New Conversation" },
      ...prev
    ]);
    
    // Set it as active
    setActiveConversationId(conversationId);
    
    // Refresh conversations list
    getConversations().then(data => {
      setConversations(data.map(c => ({ id: c.id, title: c.title })));
    }).catch(error => {
      console.error("Error refreshing conversations:", error);
    });
  };

  return (
    <div className="container py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <Button 
          onClick={() => setActiveConversationId(undefined)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Chat History Sidebar */}
        <Card className="md:col-span-1 h-[75vh] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-md">Chat History</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-muted-foreground">No conversations yet</span>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map(conversation => (
                  <Button
                    key={conversation.id}
                    variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    {conversation.title}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Chat Window */}
        <div className="md:col-span-3">
          <ChatWindow 
            conversationId={activeConversationId} 
            onNewConversation={handleNewConversation}
          />
        </div>
      </div>
    </div>
  );
} 