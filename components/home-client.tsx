'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { InboxView } from '@/components/email/inbox-view';
import { EmailViewer } from '@/components/email/email-viewer';
import { useSession } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';

interface Email {
  id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body?: string;
  htmlBody?: string;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  receivedAt: Date;
  labels?: string[];
}

export default function HomeClient() {
  const { user, isLoading, isAuthenticated, login } = useSession();
  const [currentCategory, setCurrentCategory] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">MailMind</h1>
            <p className="text-gray-600">
              Your AI-powered email client. Sign in with Google to get started.
            </p>
          </div>
          <Button 
            onClick={login}
            className="bg-black hover:bg-gray-800 text-white px-8 py-3"
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <MainLayout 
      user={{
        name: user.name,
        email: user.email,
        image: user.picture,
      }}
      currentCategory={currentCategory}
      onCategoryChange={setCurrentCategory}
      onSearchChange={setSearchQuery}
    >
      <div className="flex flex-1 h-full">
        <InboxView
          category={currentCategory}
          searchQuery={searchQuery}
          className={selectedEmail ? 'w-1/2 lg:w-2/5' : 'flex-1'}
          onEmailSelect={(email) => {
            setSelectedEmail(email as Email);
          }}
        />
        
        {selectedEmail && (
          <div className="flex-1 border-l border-gray-200">
            <EmailViewer
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              onReply={() => {
                console.log('Reply to:', selectedEmail.id);
                // TODO: Open compose dialog
              }}
              onReplyAll={() => {
                console.log('Reply all to:', selectedEmail.id);
                // TODO: Open compose dialog
              }}
              onForward={() => {
                console.log('Forward:', selectedEmail.id);
                // TODO: Open compose dialog
              }}
              onArchive={() => {
                console.log('Archive:', selectedEmail.id);
                setSelectedEmail(null);
              }}
              onDelete={() => {
                console.log('Delete:', selectedEmail.id);
                setSelectedEmail(null);
              }}
              onStar={() => {
                console.log('Star:', selectedEmail.id);
                // Update the email's starred status
                setSelectedEmail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
              }}
              onToggleImportant={() => {
                console.log('Toggle important:', selectedEmail.id);
                // Update the email's important status
                setSelectedEmail(prev => prev ? { ...prev, isImportant: !prev.isImportant } : null);
              }}
              onAISummarize={() => {
                console.log('AI Summarize:', selectedEmail.id);
                // TODO: Call AI summarization API
              }}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}