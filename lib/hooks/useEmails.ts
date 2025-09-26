'use client';

import { useEmailContext } from '@/lib/context/email-context';
import { useEffect } from 'react';

// Export the Email interface from context
export { type Email } from '@/lib/context/email-context';

interface UseEmailsOptions {
  category?: string;
  searchQuery?: string;
  maxResults?: number;
}

export function useEmails({ category = 'inbox', searchQuery, maxResults = 10 }: UseEmailsOptions = {}) {
  const {
    emails,
    loading,
    error,
    hasMore,
    fetchEmails,
    refreshEmails: contextRefreshEmails,
    loadMoreEmails: contextLoadMoreEmails,
    starEmail,
    unstarEmail,
    archiveEmail,
    deleteEmail,
    markAsRead,
    markAsUnread,
  } = useEmailContext();

  // Fetch emails when category or search changes (but only if not cached)
  useEffect(() => {
    fetchEmails(category, searchQuery, false, maxResults);
  }, [category, searchQuery, maxResults, fetchEmails]);

  const refreshEmails = () => {
    contextRefreshEmails(category, searchQuery);
  };

  const loadMoreEmails = () => {
    contextLoadMoreEmails(category, searchQuery);
  };

  const handleArchiveEmail = (emailId: string) => {
    return archiveEmail(emailId, category);
  };

  return {
    emails,
    loading,
    error,
    hasMore,
    refreshEmails,
    loadMoreEmails,
    // Email actions
    starEmail,
    unstarEmail,
    archiveEmail: handleArchiveEmail,
    deleteEmail,
    markAsRead,
    markAsUnread,
  };
}