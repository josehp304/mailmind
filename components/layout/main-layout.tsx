"use client"
import React, { useState, useEffect } from 'react';
import { TopBar } from './top-bar';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
  className?: string;
  currentCategory?: string;
  onCategoryChange?: (category: string) => void;
  onSearchChange?: (query: string) => void;
}

export function MainLayout({ 
  children, 
  user, 
  className,
  currentCategory = 'inbox',
  onCategoryChange,
  onSearchChange
}: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailStats, setEmailStats] = useState({
    total: 0,
    unread: 0,
    important: 0,
  });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({
    inbox: 0,
    starred: 0,
    sent: 0,
    drafts: 0,
    spam: 0,
    trash: 0,
    important: 0,
    promotions: 0,
    'cold-emails': 0,
  });

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, these would come from API calls
    setEmailStats({
      total: 23,
      unread: 5,
      important: 2,
    });
    
    setUnreadCounts({
      inbox: 5,
      starred: 1,
      sent: 0,
      drafts: 2,
      spam: 3,
      trash: 0,
      important: 2,
      promotions: 8,
      'cold-emails': 1,
    });
  }, []);

  const handleMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCategoryChange = (category: string) => {
    onCategoryChange?.(category);
    setIsMobileMenuOpen(false); // Close mobile menu when category changes
  };

  const handleSearchChange = (query: string) => {
    onSearchChange?.(query);
  };

  return (
    <div className={cn('flex h-screen bg-gray-50', className)}>
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:relative md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          unreadCounts={unreadCounts}
          currentCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
        />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top bar */}
        <TopBar
          user={user}
          emailStats={emailStats}
          onMenuClick={handleMenuClick}
          onSearchChange={handleSearchChange}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}