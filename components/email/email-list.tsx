"use client"
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Archive, 
  Trash2, 
  MoreHorizontal,
  Paperclip,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  receivedAt: Date;
  labels?: string[];
}

interface EmailListItemProps {
  email: Email;
  isSelected?: boolean;
  onClick?: () => void;
  onStar?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onToggleImportant?: () => void;
}

export function EmailListItem({
  email,
  isSelected,
  onClick,
  onStar,
  onArchive,
  onDelete,
  onToggleImportant,
}: EmailListItemProps) {
  const fromName = email.from.split('<')[0].trim() || email.from;
  const fromEmail = email.from.includes('<') 
    ? email.from.split('<')[1].replace('>', '') 
    : email.from;

  return (
    <div
      className={cn(
        'flex items-center px-2 sm:px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group w-[95vw] md:w-[80vw] ',
        isSelected && 'bg-blue-50 border-blue-200',
        !email.isRead && 'bg-white border-l-4 border-l-blue-500 '
      )}
      onClick={onClick}
    >
      {/* Selection checkbox (hidden on mobile, visible on larger screens) */}
      <div className="hidden sm:block w-4 mr-2 sm:mr-3">
        <input type="checkbox" className="hidden" />
      </div>

      {/* Star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStar?.();
        }}
        className={cn(
          'mr-2 sm:mr-3 p-1 rounded hover:bg-gray-200 transition-colors',
          email.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
        )}
      >
        <Star className={cn('w-3 h-3 sm:w-4 sm:h-4', email.isStarred && 'fill-current')} />
      </button>

      {/* Important marker - hidden on mobile */}
      <div className="hidden sm:block mr-3 w-4">
        {email.isImportant && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleImportant?.();
            }}
            className="text-orange-500 hover:text-orange-600"
          >
            <Zap className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>

      {/* Mobile layout - stacked */}
      <div className="flex-1 min-w-0 sm:hidden">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center min-w-0 flex-1 mr-2">
            <Avatar className="h-6 w-6 mr-2 flex-shrink-0">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fromName)}`} />
              <AvatarFallback className="text-xs">
                {fromName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div 
                className={cn(
                  'text-xs sm:text-sm',
                  !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                )}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {fromName}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <div className="text-xs text-gray-500">
              {formatDistanceToNow(email.receivedAt, { addSuffix: false }).replace('about ', '').replace(' ago', '')}
            </div>
            {email.isImportant && (
              <Zap className="w-3 h-3 text-orange-500 fill-current" />
            )}
            {email.hasAttachments && (
              <Paperclip className="w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>
        
        <div className="mb-1">
          <h3 
            className={cn(
              'text-sm',
              !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {email.subject || '(no subject)'}
          </h3>
        </div>
        
        <div className="flex items-center justify-between">
          <p 
            className="text-xs text-gray-600 flex-1 mr-2"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {email.snippet}
          </p>
          
          {/* Mobile actions */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onArchive?.();
              }}
              className="h-6 w-6 p-0"
            >
              <Archive className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {email.labels && email.labels.length > 0 && (
          <div className="flex space-x-1 mt-2">
            {email.labels.slice(0, 3).map((label) => (
              <Badge key={label} variant="secondary" className="text-xs px-1 py-0">
                {label}
              </Badge>
            ))}
            {email.labels.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                +{email.labels.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Desktop layout - horizontal */}
      {/* Sender info */}
      <div className="hidden sm:flex items-center min-w-0 w-32 md:w-40 lg:w-48 mr-4">
        <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fromName)}`} />
          <AvatarFallback>
            {fromName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div 
            className={cn(
              'text-sm',
              !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {fromName}
          </div>
          <div 
            className="text-xs text-gray-500 hidden lg:block"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {fromEmail}
          </div>
        </div>
      </div>

      {/* Email content */}
      <div className="hidden sm:block flex-1 min-w-0 mr-4">
        <div className="flex items-center space-x-2 mb-1 min-w-0">
          <h3 
            className={cn(
              'text-sm flex-1 min-w-0',
              !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            )}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {email.subject || '(no subject)'}
          </h3>
          {email.hasAttachments && (
            <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
        <p 
          className="text-sm text-gray-600 min-w-0"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {email.snippet}
        </p>
        {email.labels && email.labels.length > 0 && (
          <div className="flex space-x-1 mt-1 min-w-0 overflow-hidden">
            {email.labels.slice(0, 2).map((label) => (
              <Badge key={label} variant="secondary" className="text-xs flex-shrink-0">
                {label}
              </Badge>
            ))}
            {email.labels.length > 2 && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                +{email.labels.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Time - hidden on mobile, responsive width on desktop */}
      <div className="hidden sm:block text-xs text-gray-500 mr-4 w-12 md:w-16 text-right">
        <div className="md:hidden">
          {formatDistanceToNow(email.receivedAt, { addSuffix: false }).replace('about ', '').replace(' ago', '')}
        </div>
        <div className="hidden md:block">
          {formatDistanceToNow(email.receivedAt, { addSuffix: true })}
        </div>
      </div>

      {/* Desktop Actions - hidden on mobile */}
      <div className="hidden sm:flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onArchive?.();
          }}
          className="h-8 w-8 p-0"
        >
          <Archive className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onEmailSelect?: (email: Email) => void;
  onEmailStar?: (emailId: string) => void;
  onEmailArchive?: (emailId: string) => void;
  onEmailDelete?: (emailId: string) => void;
  onEmailToggleImportant?: (emailId: string) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function EmailList({
  emails,
  selectedEmailId,
  onEmailSelect,
  onEmailStar,
  onEmailArchive,
  onEmailDelete,
  onEmailToggleImportant,
  loading,
  hasMore,
  onLoadMore,
  className,
}: EmailListProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8 sm:py-12', className)}>
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">Loading emails...</p>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8 sm:py-12', className)}>
        <div className="text-center px-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-lg sm:text-2xl">📧</span>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No emails found</h3>
          <p className="text-gray-500 text-sm sm:text-base">
            Your inbox is empty or no emails match the current filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={selectedEmailId === email.id}
              onClick={() => {
                onEmailSelect?.(email);
              }}
              onStar={() => onEmailStar?.(email.id)}
              onArchive={() => onEmailArchive?.(email.id)}
              onDelete={() => onEmailDelete?.(email.id)}
              onToggleImportant={() => onEmailToggleImportant?.(email.id)}
            />
          ))}
        </div>
        
        {/* Load more button */}
        {hasMore && !loading && (
          <div className="flex justify-center py-3 sm:py-4 border-t px-4">
            <button
              onClick={() => {
                console.log('Load More clicked, hasMore:', hasMore, 'loading:', loading);
                onLoadMore?.();
              }}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <span>Load More Emails</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Loading more indicator */}
        {loading && (
          <div className="flex justify-center py-3 sm:py-4 border-t px-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm sm:text-base">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading more emails...</span>
            </div>
          </div>
        )}
        
        {/* No more emails indicator */}
        {!hasMore && !loading && emails.length > 0 && (
          <div className="flex justify-center py-3 sm:py-4 border-t px-4">
            <div className="text-center text-gray-500">
              <div className="text-sm">You've reached the end</div>
              <div className="text-xs mt-1 hidden sm:block">No more emails to load</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}