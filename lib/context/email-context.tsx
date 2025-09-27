'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

interface EmailCache {
  [key: string]: {
    emails: Email[];
    nextPageToken?: string | null;
    lastFetched: Date;
  };
}

interface EmailContextType {
  // Email data
  emails: Email[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Cache methods
  getCachedEmails: (category: string, searchQuery?: string) => Email[] | null;
  setCachedEmails: (category: string, emails: Email[], nextPageToken?: string | null, searchQuery?: string) => void;
  clearCache: () => void;
  
  // Email operations
  fetchEmails: (category: string, searchQuery?: string, reset?: boolean, maxResults?: number) => Promise<void>;
  refreshEmails: (category: string, searchQuery?: string) => Promise<void>;
  loadMoreEmails: (category: string, searchQuery?: string) => Promise<void>;
  
  // Email actions
  starEmail: (emailId: string) => Promise<void>;
  unstarEmail: (emailId: string) => Promise<void>;
  archiveEmail: (emailId: string, category: string) => Promise<void>;
  deleteEmail: (emailId: string) => Promise<void>;
  markAsRead: (emailId: string) => Promise<void>;
  markAsUnread: (emailId: string) => Promise<void>;
  
  // UI state
  setCurrentEmails: (emails: Email[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<EmailCache>({});
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Generate cache key
  const getCacheKey = (category: string, searchQuery?: string) => {
    return searchQuery ? `${category}:${searchQuery}` : category;
  };

  // Get cached emails
  const getCachedEmails = useCallback((category: string, searchQuery?: string): Email[] | null => {
    const key = getCacheKey(category, searchQuery);
    const cached = cache[key];
    
    // Return cached data if it exists and is less than 5 minutes old
    if (cached && (Date.now() - cached.lastFetched.getTime()) < 5 * 60 * 1000) {
      return cached.emails;
    }
    
    return null;
  }, [cache]);

  // Set cached emails
  const setCachedEmails = useCallback((category: string, emails: Email[], nextPageToken?: string | null, searchQuery?: string) => {
    const key = getCacheKey(category, searchQuery);
    setCache(prev => ({
      ...prev,
      [key]: {
        emails,
        nextPageToken,
        lastFetched: new Date(),
      }
    }));
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({});
  }, []);

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
  const fetchEmails = useCallback(async (category: string, searchQuery?: string, reset = false, maxResults = 50) => {
    // Check cache first unless it's a reset/refresh
    if (!reset) {
      const cached = getCachedEmails(category, searchQuery);
      if (cached) {
        setEmails(cached);
        const key = getCacheKey(category, searchQuery);
        setNextPageToken(cache[key]?.nextPageToken || null);
        return;
      }
    }

    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const query = buildQuery(category, searchQuery);
      const params = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString(),
      });

      const key = getCacheKey(category, searchQuery);
      let pageToken: string | null = null;
      
      if (reset) {
        pageToken = null;
      } else {
        // For load more, use current nextPageToken or get it from cache
        pageToken = nextPageToken || cache[key]?.nextPageToken || null;
      }
      
      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      const response = await fetch(`/api/gmail/messages?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      console.log('API Response:', { 
        messageCount: data.messages?.length || 0,
        nextPageToken: data.nextPageToken,
        hasNextPageToken: !!data.nextPageToken 
      });
      
      // Transform Gmail API data to our Email interface
      const transformedEmails: Email[] = data.messages?.map((message: any) => ({
        gmailId: message.gmailId,
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

      const newEmails = reset ? transformedEmails : [...emails, ...transformedEmails];
      setEmails(newEmails);
      setNextPageToken(data.nextPageToken || null);
      
      console.log('Updated emails:', { 
        newCount: newEmails.length, 
        addedCount: transformedEmails.length,
        nextPageToken: data.nextPageToken 
      });
      
      // Cache the results
      setCachedEmails(category, newEmails, data.nextPageToken, searchQuery);
      
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, [loading, emails, cache, getCachedEmails, setCachedEmails, buildQuery]);

  // Refresh emails (force fetch)
  const refreshEmails = useCallback(async (category: string, searchQuery?: string) => {
    await fetchEmails(category, searchQuery, true);
  }, [fetchEmails]);

  // Load more emails
  const loadMoreEmails = useCallback(async (category: string, searchQuery?: string) => {
    console.log('LoadMore called:', { 
      category, 
      searchQuery, 
      hasNextPageToken: !!nextPageToken, 
      loading,
      currentEmailCount: emails.length 
    });
    
    if (nextPageToken && !loading) {
      await fetchEmails(category, searchQuery, false, 50); // Use same default maxResults
    } else {
      console.log('LoadMore skipped:', { 
        reason: !nextPageToken ? 'No next page token' : 'Already loading' 
      });
    }
  }, [fetchEmails, nextPageToken, loading, emails.length]);

  // Email action handlers with cache updates
  const starEmail = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/messages/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'star' }),
      });

      if (!response.ok) throw new Error('Failed to star email');

      // Update current emails
      setEmails(prev =>
        prev.map(email =>
          email.gmailId === emailId ? { ...email, isStarred: true } : email
        )
      );
      
      // Update cache
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          newCache[key] = {
            ...newCache[key],
            emails: newCache[key].emails.map(email =>
              email.gmailId === emailId ? { ...email, isStarred: true } : email
            ),
          };
        });
        return newCache;
      });
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

      // Update current emails
      setEmails(prev =>
        prev.map(email =>
          email.gmailId === emailId ? { ...email, isStarred: false } : email
        )
      );
      
      // Update cache
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          newCache[key] = {
            ...newCache[key],
            emails: newCache[key].emails.map(email =>
              email.gmailId === emailId ? { ...email, isStarred: false } : email
            ),
          };
        });
        return newCache;
      });
    } catch (err) {
      console.error('Error unstarring email:', err);
      throw err;
    }
  }, []);

  const archiveEmail = useCallback(async (emailId: string, category: string) => {
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
        
        // Update cache
        setCache(prev => {
          const newCache = { ...prev };
          const inboxKey = getCacheKey('inbox');
          if (newCache[inboxKey]) {
            newCache[inboxKey] = {
              ...newCache[inboxKey],
              emails: newCache[inboxKey].emails.filter(email => email.gmailId !== emailId),
            };
          }
          return newCache;
        });
      }
    } catch (err) {
      console.error('Error archiving email:', err);
      throw err;
    }
  }, []);

  const deleteEmail = useCallback(async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/messages/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trash' }),
      });

      if (!response.ok) throw new Error('Failed to delete email');

      // Remove from current emails
      setEmails(prev => prev.filter(email => email.gmailId !== emailId));
      
      // Update cache
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          newCache[key] = {
            ...newCache[key],
            emails: newCache[key].emails.filter(email => email.gmailId !== emailId),
          };
        });
        return newCache;
      });
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
        body: JSON.stringify({ action: 'markRead' }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      // Update current emails
      setEmails(prev =>
        prev.map(email =>
          email.gmailId === emailId ? { ...email, isRead: true } : email
        )
      );
      
      // Update cache
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          newCache[key] = {
            ...newCache[key],
            emails: newCache[key].emails.map(email =>
              email.gmailId === emailId ? { ...email, isRead: true } : email
            ),
          };
        });
        return newCache;
      });
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
        body: JSON.stringify({ action: 'markUnread' }),
      });

      if (!response.ok) throw new Error('Failed to mark as unread');

      // Update current emails
      setEmails(prev =>
        prev.map(email =>
          email.gmailId === emailId ? { ...email, isRead: false } : email
        )
      );
      
      // Update cache
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          newCache[key] = {
            ...newCache[key],
            emails: newCache[key].emails.map(email =>
              email.gmailId === emailId ? { ...email, isRead: false } : email
            ),
          };
        });
        return newCache;
      });
    } catch (err) {
      console.error('Error marking as unread:', err);
      throw err;
    }
  }, []);

  const setCurrentEmails = useCallback((emails: Email[]) => {
    setEmails(emails);
  }, []);

  const value: EmailContextType = {
    emails,
    loading,
    error,
    hasMore: !!nextPageToken,
    getCachedEmails,
    setCachedEmails,
    clearCache,
    fetchEmails,
    refreshEmails,
    loadMoreEmails,
    starEmail,
    unstarEmail,
    archiveEmail,
    deleteEmail,
    markAsRead,
    markAsUnread,
    setCurrentEmails,
    setLoading,
    setError,
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmailContext() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmailContext must be used within an EmailProvider');
  }
  return context;
}