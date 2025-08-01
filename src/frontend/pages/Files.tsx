import React from 'react';
import { AppLayout } from '@/frontend/components/layout/AppLayout';
import { FileUploadSection } from '@/frontend/features/files/components/FileUploadSection';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { useAuthCheck } from '@/frontend/hooks/useAuthCheck';
import { motion } from 'framer-motion';

export default function Files() {
  const { user, loading } = useAuthCheck();

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-6">Document Manager</h1>
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="p-0">
              <FileUploadSection />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
