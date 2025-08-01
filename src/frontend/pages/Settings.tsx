import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { AlertCircle, User, Lock, Database, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import ProfileSettings from "@/frontend/features/settings/components/ProfileSettings";
import PasswordSettings from "@/frontend/features/settings/components/PasswordSettings";
import DeleteAccount from "@/frontend/features/settings/components/DeleteAccount";
import AiSettings from "@/frontend/features/settings/components/AiSettings";
import DataExport from "@/frontend/features/settings/components/DataExport";
import HelpSupport from "@/frontend/features/settings/components/HelpSupport";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <AppLayout>
      <div className="container p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            Changes to your account settings will be applied immediately.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full md:w-[675px]">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Password</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Data</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <span role="img" aria-label="AI">🤖</span>
              <span>AI</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>Help</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <div className="grid gap-6">
              <ProfileSettings />
            </div>
          </TabsContent>
          
          <TabsContent value="password" className="space-y-4">
            <div className="grid gap-6">
              <PasswordSettings />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4">
            <div className="grid gap-6">
              <DataExport />
              <DeleteAccount />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="grid gap-6">
              <AiSettings />
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="grid gap-6">
              <HelpSupport />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}