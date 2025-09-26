"use client"
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  Shield, 
  Star, 
  Zap,
  Snowflake,
  Tag,
  Plus,
  Settings
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  unreadCounts?: Record<string, number>;
  currentCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const defaultCategories = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, color: 'text-blue-600' },
  { id: 'starred', name: 'Starred', icon: Star, color: 'text-yellow-600' },
  { id: 'sent', name: 'Sent', icon: Send, color: 'text-green-600' },
  { id: 'drafts', name: 'Drafts', icon: FileText, color: 'text-gray-600' },
  { id: 'spam', name: 'Spam', icon: Shield, color: 'text-red-600' },
  { id: 'trash', name: 'Trash', icon: Trash2, color: 'text-gray-600' },
  { id: 'important', name: 'Important', icon: Zap, color: 'text-orange-600' },
  { id: 'promotions', name: 'Promotions', icon: Tag, color: 'text-purple-600' },
  { id: 'cold-emails', name: 'Cold Emails', icon: Snowflake, color: 'text-cyan-600' },
];

export function Sidebar({ className, unreadCounts = {}, currentCategory = 'inbox', onCategoryChange }: SidebarProps) {
  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200 w-64', className)}>
      {/* Compose Button */}
      <div className="p-4">
        <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      {/* Navigation Categories */}
      <nav className="flex-1 px-2">
        <div className="space-y-1">
          {defaultCategories.map((category) => {
            const Icon = category.icon;
            const unreadCount = unreadCounts[category.id] || 0;
            const isActive = currentCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange?.(category.id)}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  'hover:bg-gray-100',
                  isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700'
                )}
              >
                <Icon className={cn('w-5 h-5 mr-3', category.color)} />
                <span className="flex-1 text-left">{category.name}</span>
                {unreadCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'ml-2 text-xs',
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Labels */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Labels
            </h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {/* Custom labels will be populated here */}
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-100">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
              <span className="flex-1 text-left">Work</span>
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-100">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
              <span className="flex-1 text-left">Personal</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" className="w-full justify-start text-gray-600">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}