import React from "react";
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <AppLayout>
      <div className="container p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: January 15, 2025
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We collect the following information to provide you with our productivity services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, and password</li>
                <li><strong>Productivity Data:</strong> Tasks, notes, calendar events, projects, and files you create</li>
                <li><strong>AI Interactions:</strong> Conversations and suggestions to improve our AI features</li>
                <li><strong>Google Calendar:</strong> Calendar data when you choose to integrate with Google Calendar</li>
                <li><strong>Usage Data:</strong> How you interact with our application to improve user experience</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Your data is used to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our productivity services</li>
                <li>Sync your data across devices</li>
                <li>Provide AI-powered suggestions and assistance</li>
                <li>Integrate with third-party services like Google Calendar (with your consent)</li>
                <li>Improve our application and user experience</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Storage & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We take data security seriously:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All data is encrypted using AES-256 encryption</li>
                <li>Data is stored securely with Supabase infrastructure</li>
                <li>Access is restricted to authorized personnel only</li>
                <li>Regular security audits and updates are performed</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Under GDPR, you have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Export your data in a structured format</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
              </ul>
              <p className="mt-4">You can exercise these rights through your account settings or by contacting us.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p>We retain your data for as long as your account is active. When you delete your account, all associated data is permanently removed from our systems within 30 days.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>If you have any questions about this Privacy Policy or your data, please contact us through the application's support features.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 