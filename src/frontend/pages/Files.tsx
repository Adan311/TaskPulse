
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/frontend/components/layout/AppLayout';
import { FileUploadSection } from '@/frontend/components/files/FileUploadSection';
import { NotesSection } from '@/frontend/components/notes/NotesSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/frontend/components/ui/button';
import { motion } from 'framer-motion';

const FilesPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'files' | 'notes'>('files');

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center p-6 h-64">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view and manage your files and notes.</p>
            <Button asChild>
              <a href="/auth/SignIn">Sign In</a>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-6">Document Manager</h1>
          
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="p-0">
              <Tabs defaultValue="files" className="w-full" onValueChange={(value) => setActiveTab(value as 'files' | 'notes')}>
                <TabsList className="grid grid-cols-2 w-full rounded-t-lg border-b">
                  <TabsTrigger value="files" className="text-base py-3">Files</TabsTrigger>
                  <TabsTrigger value="notes" className="text-base py-3">Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="files" className="p-6 focus:outline-none">
                  <FileUploadSection />
                </TabsContent>
                
                <TabsContent value="notes" className="p-6 focus:outline-none">
                  <NotesSection />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default FilesPage;
