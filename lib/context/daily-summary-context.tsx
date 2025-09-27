'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useEmailContext } from './email-context';

export interface DailySummary {
  id?: string;
  date: string;
  lastEmailId?: string;
  summary: string;
  snippet: string;
  keyPoints: string[];
  urgentCount: number;
  totalCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DailySummaryCache {
  [dateKey: string]: {
    summary: DailySummary;
    lastFetched: Date;
    lastEmailCount: number;
  };
}

interface DailySummaryContextType {
  // Current summary
  dailySummary: DailySummary | null;
  loading: boolean;
  error: string | null;
  
  // Cache operations
  getCachedSummary: (date?: string) => DailySummary | null;
  refreshSummary: (date?: string, forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
  
  // Summary status
  isStale: boolean; // True if email count changed since last summary
  lastUpdated: Date | null;
}

const DailySummaryContext = createContext<DailySummaryContextType | undefined>(undefined);

export function DailySummaryProvider({ children }: { children: ReactNode }) {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<DailySummaryCache>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { emails } = useEmailContext();

  // Generate date key for caching (YYYY-MM-DD format)
  const getDateKey = (date?: Date) => {
    const targetDate = date || new Date();
    return targetDate.toISOString().split('T')[0];
  };

  // Get today's emails from the email context
  const getTodaysEmails = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return emails.filter(email => {
      const emailDate = new Date(email.receivedAt);
      return emailDate >= today && emailDate < tomorrow;
    });
  }, [emails]);

  // Check if current summary is stale (email count changed)
  const isStale = useCallback(() => {
    const dateKey = getDateKey();
    const cached = cache[dateKey];
    const currentEmailCount = getTodaysEmails().length;
    
    if (!cached) return true;
    return cached.lastEmailCount !== currentEmailCount;
  }, [cache, getTodaysEmails]);

  // Get cached summary for a specific date
  const getCachedSummary = useCallback((date?: string): DailySummary | null => {
    const dateKey = date || getDateKey();
    const cached = cache[dateKey];
    
    // Return cached summary if it exists and is less than 30 minutes old
    if (cached && (Date.now() - cached.lastFetched.getTime()) < 30 * 60 * 1000) {
      return cached.summary;
    }
    
    return null;
  }, [cache]);

  // Save summary to database
  const saveSummaryToDatabase = useCallback(async (summary: DailySummary) => {
    try {
      // For now, skip database operations due to user ID UUID issues
      // TODO: Fix user management and UUID handling
      console.log('Skipping database save for now:', summary);
      return { summary };
    } catch (error) {
      console.error('Error saving summary to database:', error);
      // Don't throw - we can still use the generated summary even if DB save fails
    }
  }, []);

  // Load summary from database
  const loadSummaryFromDatabase = useCallback(async (date?: string): Promise<DailySummary | null> => {
    try {
      // For now, skip database operations due to user ID UUID issues
      // TODO: Fix user management and UUID handling
      console.log('Skipping database load for now, date:', date);
      return null;
    } catch (error) {
      console.error('Error loading summary from database:', error);
    }
    
    return null;
  }, []);

  // Generate new summary using AI
  const generateAISummary = useCallback(async (todaysEmails: any[], date?: string): Promise<DailySummary> => {
    const response = await fetch('/api/ai/daily-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails: todaysEmails }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI summary');
    }

    const data = await response.json();
    const dateKey = date || getDateKey();
    
    const summary: DailySummary = {
      date: dateKey,
      lastEmailId: todaysEmails[0]?.gmailId || null,
      summary: data.summary.summary,
      snippet: data.summary.snippet,
      keyPoints: data.summary.keyPoints,
      urgentCount: data.summary.urgentEmails,
      totalCount: data.summary.totalEmails,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return summary;
  }, []);

  // Refresh summary (main function)
  const refreshSummary = useCallback(async (date?: string, forceRefresh = false) => {
    const dateKey = date || getDateKey();
    
    // Check cache first unless forced refresh
    if (!forceRefresh) {
      const cachedSummary = getCachedSummary(dateKey);
      if (cachedSummary && !isStale()) {
        setDailySummary(cachedSummary);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // First try to load from database
      let summary = await loadSummaryFromDatabase(dateKey);
      const todaysEmails = getTodaysEmails();
      const currentEmailCount = todaysEmails.length;

      // Check if database summary is still valid (email count matches)
      const shouldRegenerateFromDB = summary && (
        forceRefresh || 
        summary.totalCount !== currentEmailCount ||
        !summary.lastEmailId ||
        todaysEmails.some(email => email.gmailId > (summary!.lastEmailId || ''))
      );

      // Generate new summary if needed
      if (!summary || shouldRegenerateFromDB) {
        if (todaysEmails.length === 0) {
          summary = {
            date: dateKey,
            summary: "No emails received today.",
            snippet: "Your inbox is empty today",
            keyPoints: [],
            urgentCount: 0,
            totalCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } else {
          summary = await generateAISummary(todaysEmails, dateKey);
        }

        // Save to database (don't await to avoid blocking UI)
        saveSummaryToDatabase(summary);
      }

      // Update cache
      setCache(prev => ({
        ...prev,
        [dateKey]: {
          summary,
          lastFetched: new Date(),
          lastEmailCount: currentEmailCount,
        }
      }));

      setDailySummary(summary);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error refreshing daily summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh summary');
    } finally {
      setLoading(false);
    }
  }, [getCachedSummary, loadSummaryFromDatabase, generateAISummary, saveSummaryToDatabase, getTodaysEmails, isStale]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({});
    setDailySummary(null);
    setLastUpdated(null);
  }, []);

  // Auto-refresh when emails change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (emails.length > 0 && isStale()) {
        refreshSummary();
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [emails.length, refreshSummary, isStale]);

  // Initial load
  useEffect(() => {
    refreshSummary();
  }, []);

  const value: DailySummaryContextType = {
    dailySummary,
    loading,
    error,
    getCachedSummary,
    refreshSummary,
    clearCache,
    isStale: isStale(),
    lastUpdated,
  };

  return (
    <DailySummaryContext.Provider value={value}>
      {children}
    </DailySummaryContext.Provider>
  );
}

export function useDailySummary() {
  const context = useContext(DailySummaryContext);
  if (context === undefined) {
    throw new Error('useDailySummary must be used within a DailySummaryProvider');
  }
  return context;
}