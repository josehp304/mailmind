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
        'flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group',
        isSelected && 'bg-blue-50 border-blue-200',
        !email.isRead && 'bg-white border-l-4 border-l-blue-500'
      )}
      onClick={onClick}
    >
      {/* Selection checkbox (hidden, can be added later) */}
      <div className="w-4 mr-3">
        <input type="checkbox" className="hidden" />
      </div>

      {/* Star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStar?.();
        }}
        className={cn(
          'mr-3 p-1 rounded hover:bg-gray-200 transition-colors',
          email.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
        )}
      >
        <Star className={cn('w-4 h-4', email.isStarred && 'fill-current')} />
      </button>

      {/* Important marker */}
      <div className="mr-3 w-4">
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

      {/* Sender info */}
      <div className="flex items-center min-w-0 w-48 mr-4">
        <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
          <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fromName)}`} />
          <AvatarFallback>
            {fromName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className={cn(
            'text-sm truncate',
            !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
          )}>
            {fromName}
          </div>
          <div className="text-xs text-gray-500 truncate">{fromEmail}</div>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className={cn(
            'text-sm truncate',
            !email.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
          )}>
            {email.subject || '(no subject)'}
          </h3>
          {email.hasAttachments && (
            <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-600 truncate">
          {email.snippet}
        </p>
        {email.labels && email.labels.length > 0 && (
          <div className="flex space-x-1 mt-1">
            {email.labels.slice(0, 2).map((label) => (
              <Badge key={label} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
            {email.labels.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{email.labels.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Time */}
      <div className="text-xs text-gray-500 mr-4 w-16 text-right">
        {formatDistanceToNow(email.receivedAt, { addSuffix: true })}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
  className,
}: EmailListProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading emails...</p>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            📧
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
          <p className="text-gray-500">
            Your inbox is empty or no emails match the current filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('divide-y divide-gray-100', className)}>
      {emails.map((email) => (
        <EmailListItem
          key={email.id}
          email={email}
          isSelected={selectedEmailId === email.id}
          onClick={() => onEmailSelect?.(email)}
          onStar={() => onEmailStar?.(email.id)}
          onArchive={() => onEmailArchive?.(email.id)}
          onDelete={() => onEmailDelete?.(email.id)}
          onToggleImportant={() => onEmailToggleImportant?.(email.id)}
        />
      ))}
    </div>
  );
}