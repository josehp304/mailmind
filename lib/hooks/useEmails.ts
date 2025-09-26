'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Email {
  gmailId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  body: string;
  htmlBody?: string;
  snippet: string;
  labelIds: string[];
  isRead: boolean;
  isImportant: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  receivedAt: Date;
}

interface UseEmailsOptions {
  category?: string;
  searchQuery?: string;
  maxResults?: number;
}

export function useEmails({ category = 'inbox', searchQuery, maxResults = 50 }: UseEmailsOptions = {}) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Build Gmail query based on category
  const buildQuery = useCallback((category: string, searchQuery?: string) => {
    let query = '';
    
    switch (category) {
      case 'starred':
        query = 'is:starred';
        break;
      case 'important':
        query = 'is:important';
        break;
      case 'sent':
        query = 'in:sent';
        break;
      case 'drafts':
        query = 'in:drafts';
        break;
      case 'spam':
        query = 'in:spam';
        break;
      case 'trash':
        query = 'in:trash';
        break;
      case 'promotions':
        query = 'category:promotions';
        break;
      case 'updates':
        query = 'category:updates';
        break;
      case 'forums':
        query = 'category:forums';
        break;
      case 'social':
        query = 'category:social';
        break;
      default: // inbox
        query = 'in:inbox';
    }

    if (searchQuery) {
      query += ` ${searchQuery}`;
    }

    return query;
  }, []);

  // Fetch emails from API
  const fetchEmails = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const query = buildQuery(category, searchQuery);
      const params = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString(),
      });

      if (!reset && nextPageToken) {
        params.set('pageToken', nextPageToken);
      }

      const response = await fetch(`/api/gmail/messages?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      
      // Transform Gmail API data to our Email interface
      const transformedEmails: Email[] = data.messages?.map((message: any) => ({
        gmailId: message.id,
        threadId: message.threadId,
        subject: message.subject || '(No subject)',
        from: message.from || 'Unknown sender',
        to: message.to || '',
        cc: message.cc,
        bcc: message.bcc,
        body: message.body || message.snippet || '',
        htmlBody: message.htmlBody,
        snippet: message.snippet || '',
        labelIds: message.labelIds || [],
        isRead: message.isRead ?? true,
        isImportant: message.isImportant ?? false,
        isStarred: message.isStarred ?? false,
        hasAttachments: message.hasAttachments ?? false,
        receivedAt: new Date(message.receivedAt),
      })) || [];

      if (reset) {
        setEmails(transformedEmails);
      } else {
        setEmails(prev => [...prev, ...transformedEmails]);
      }
      
      setNextPageToken(data.nextPageToken || null);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery, maxResults, buildQuery, loading, nextPageToken]);

  // Email action handlers
  const starEmail = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/messages/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'star' }),
      });

      if (!response.ok) throw new Error('Failed to star email');

      setEmails(prev =>
        prev.map(email =>
          email.gmailId === emailId
            ? { ...email, isStarred: true }
            : email
        )
      );
    } catch (err) {
      console.error('Error starring email:', err);
      throw err;
    }
  }, []);

  const unstarEmail = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/messages/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unstar' }),
      });

      if (!response.ok) throw new Error('Failed to unstar email');

      setEmails(prev =>
        prev.map(email =>
          email.gmailId === emailId
            ? { ...email, isStarred: false }
            : email
        )
      );
    } catch (err) {
      console.error('Error unstarring email:', err);
      throw err;
    }
  }, []);

  const archiveEmail = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/messages/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });

      if (!response.ok) throw new Error('Failed to archive email');

      // Remove from current view if it's the inbox
      if (category === 'inbox') {
        setEmails(prev => prev.filter(email => email.gmailId !== emailId));
      }
    } catch (err) {
      console.error('Error archiving email:', err);
      throw err;
    }
  }, [category]);

  const deleteEmail = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/messages/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trash' }),
      });

      if (!response.ok) throw new Error('Failed to delete email');

      setEmails(prev => prev.filter(email => email.gmailId !== emailId));
    } catch (err) {
      console.error('Error deleting email:', err);
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/messages/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setEmails(prev =>
        prev.map(email =>
          email.gmailId === emailId
            ? { ...email, isRead: true }
            : email
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
      throw err;
    }
  }, []);

  const markAsUnread = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/messages/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unread' }),
      });

      if (!response.ok) throw new Error('Failed to mark as unread');

      setEmails(prev =>
        prev.map(email =>
          email.gmailId === emailId
            ? { ...email, isRead: false }
            : email
        )
      );
    } catch (err) {
      console.error('Error marking as unread:', err);
      throw err;
    }
  }, []);

  // Initial fetch when dependencies change
  useEffect(() => {
    fetchEmails(true);
  }, [category, searchQuery]);

  const refreshEmails = useCallback(() => {
    fetchEmails(true);
  }, [fetchEmails]);

  const loadMoreEmails = useCallback(() => {
    if (nextPageToken && !loading) {
      fetchEmails(false);
    }
  }, [fetchEmails, nextPageToken, loading]);

  return {
    emails,
    loading,
    error,
    hasMore: !!nextPageToken,
    refreshEmails,
    loadMoreEmails,
    // Email actions
    starEmail,
    unstarEmail,
    archiveEmail,
    deleteEmail,
    markAsRead,
    markAsUnread,
  };
}