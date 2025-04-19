
import React, { useState, useEffect } from 'react';
import { FileUpload } from '@/frontend/components/files/FileUpload';
import { FileList } from '@/frontend/components/files/FileList';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { AppLayout } from '@/frontend/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/frontend/components/ui/button';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FilesPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
            <p className="text-muted-foreground mb-4">Please sign in to view and manage your files.</p>
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
        <Card>
          <CardHeader>
            <CardTitle>File Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-600 text-sm">
                  Allowed file types: PDF, JPG, PNG, GIF, DOC, DOCX, XLS, XLSX
                  <br />
                  Maximum file size: 10 MB
                </p>
              </div>
              <FileUpload 
                allowedTypes={ALLOWED_FILE_TYPES}
                maxFileSize={MAX_FILE_SIZE}
              />
              <FileList />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FilesPage;
