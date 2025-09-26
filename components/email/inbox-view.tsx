'use client';

import React, { useState } from 'react';
import { EmailList } from './email-list';
import { EmailToolbar } from './email-toolbar';
import { useEmails, type Email } from '@/lib/hooks/useEmails';

interface InboxViewProps {
  category?: string;
  searchQuery?: string;
  onEmailSelect?: (email: Email) => void;
  className?: string;
}

export function InboxView({ category = 'inbox', searchQuery, onEmailSelect, className }: InboxViewProps) {
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectedEmailId, setSelectedEmailId] = useState<string>();

  const {
    emails,
    loading,
    error,
    hasMore,
    refreshEmails,
    loadMoreEmails,
    starEmail,
    unstarEmail,
    archiveEmail,
    deleteEmail,
    markAsRead,
    markAsUnread,
  } = useEmails({ category, searchQuery });

  const handleEmailSelect = (email: Email) => {
    setSelectedEmailId(email.gmailId);
    onEmailSelect?.(email);
    
    // Mark as read when selected if it's unread
    if (!email.isRead) {
      markAsRead(email.gmailId).catch(console.error);
    }
  };

  const handleEmailStar = async (emailId: string) => {
    const email = emails.find(e => e.gmailId === emailId);
    if (!email) return;

    try {
      if (email.isStarred) {
        await unstarEmail(emailId);
      } else {
        await starEmail(emailId);
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleEmailArchive = async (emailId: string) => {
    try {
      await archiveEmail(emailId);
    } catch (error) {
      console.error('Error archiving email:', error);
    }
  };

  const handleEmailDelete = async (emailId: string) => {
    try {
      await deleteEmail(emailId);
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  const handleEmailToggleImportant = async (emailId: string) => {
    // Note: Gmail API doesn't have a direct "important" action
    // This would need to be implemented with labels
    console.log('Toggle important not implemented yet for:', emailId);
  };

  const handleSelectEmail = (emailId: string, selected: boolean) => {
    const newSelected = new Set(selectedEmails);
    if (selected) {
      newSelected.add(emailId);
    } else {
      newSelected.delete(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedEmails(new Set(emails.map(email => email.gmailId)));
  };

  const handleDeselectAll = () => {
    setSelectedEmails(new Set());
  };

  const handleRefresh = () => {
    refreshEmails();
    setSelectedEmails(new Set());
  };

  const handleBulkArchive = async () => {
    const emailIds = Array.from(selectedEmails);
    try {
      await Promise.all(emailIds.map(id => archiveEmail(id)));
      setSelectedEmails(new Set());
    } catch (error) {
      console.error('Error bulk archiving:', error);
    }
  };

  const handleBulkDelete = async () => {
    const emailIds = Array.from(selectedEmails);
    try {
      await Promise.all(emailIds.map(id => deleteEmail(id)));
      setSelectedEmails(new Set());
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const handleBulkStar = async () => {
    const emailIds = Array.from(selectedEmails);
    try {
      await Promise.all(emailIds.map(id => starEmail(id)));
    } catch (error) {
      console.error('Error bulk starring:', error);
    }
  };

  const handleMarkImportant = () => {
    // Note: Would need to implement with Gmail labels
    console.log('Bulk mark important not implemented yet');
  };

  // Show error state
  if (error && !loading && emails.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 text-center ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load emails</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show empty state
  if (!loading && emails.length === 0 && !error) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.5a2.5 2.5 0 00-2.5 2.5v2.5a2.5 2.5 0 00-2.5-2.5H13" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
        <p className="text-gray-600 mb-4">
          {searchQuery 
            ? `No emails match "${searchQuery}"`
            : `No emails in your ${category}`
          }
        </p>
        {searchQuery && (
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <EmailToolbar
        selectedCount={selectedEmails.size}
        totalCount={emails.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onRefresh={handleRefresh}
        onArchiveSelected={handleBulkArchive}
        onDeleteSelected={handleBulkDelete}
        onStarSelected={handleBulkStar}
        onMarkImportant={handleMarkImportant}
      />
      
      <EmailList
        emails={emails.map(email => ({
          id: email.gmailId,
          from: email.from,
          to: email.to,
          subject: email.subject,
          snippet: email.snippet,
          isRead: email.isRead,
          isStarred: email.isStarred,
          isImportant: email.isImportant,
          hasAttachments: email.hasAttachments,
          receivedAt: email.receivedAt,
          labels: [], // Convert labelIds to labels if needed
        }))}
        selectedEmailId={selectedEmailId}
        onEmailSelect={(email) => {
          const originalEmail = emails.find(e => e.gmailId === email.id);
          if (originalEmail) {
            handleEmailSelect(originalEmail);
          }
        }}
        onEmailStar={handleEmailStar}
        onEmailArchive={handleEmailArchive}
        onEmailDelete={handleEmailDelete}
        onEmailToggleImportant={handleEmailToggleImportant}
        loading={loading}
      />

      {/* Load more button */}
      {hasMore && !loading && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMoreEmails}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Load More Emails
          </button>
        </div>
      )}
    </div>
  );
}