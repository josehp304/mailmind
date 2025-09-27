"use client"
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ComposeModal } from '@/components/email/compose-modal';
import { EmailSummaryCard } from '@/components/ai/email-summary-card';
import { 
  Reply, 
  ReplyAll, 
  Forward, 
  Archive, 
  Trash2, 
  Star,
  Zap,
  Tag,
  MoreHorizontal,
  ArrowLeft,
  Paperclip,
  Brain
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface EmailViewerProps {
  email: {
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
  };
  onBack?: () => void;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  onToggleImportant?: () => void;
  onAISummarize?: () => void;
  className?: string;
}

export function EmailViewer({
  email,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onStar,
  onToggleImportant,
  onAISummarize,
  className,
}: EmailViewerProps) {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<'reply' | 'replyAll' | 'forward' | null>(null);
  
  const fromName = email.from.split('<')[0].trim() || email.from;
  const fromEmail = email.from.includes('<') 
    ? email.from.split('<')[1].replace('>', '') 
    : email.from;

  const handleReply = () => {
    setComposeType('reply');
    setIsComposeOpen(true);
    onReply?.();
  };

  const handleReplyAll = () => {
    setComposeType('replyAll');
    setIsComposeOpen(true);
    onReplyAll?.();
  };

  const handleForward = () => {
    setComposeType('forward');
    setIsComposeOpen(true);
    onForward?.();
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className=""
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {email.subject || '(no subject)'}
          </h1>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAISummarize}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Summary
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStar}
            className={cn(
              'hover:bg-gray-100',
              email.isStarred ? 'text-yellow-500' : 'text-gray-400'
            )}
          >
            <Star className={cn('w-4 h-4', email.isStarred && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleImportant}
            className={cn(
              'hover:bg-gray-100',
              email.isImportant ? 'text-orange-500' : 'text-gray-400'
            )}
          >
            <Zap className={cn('w-4 h-4', email.isImportant && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onArchive}
          >
            <Archive className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-auto">
        {/* Email header info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fromName)}`} />
              <AvatarFallback>
                {fromName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {fromName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {fromEmail}
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-right">
                  <div>{format(email.receivedAt, 'MMM d, yyyy')}</div>
                  <div>{format(email.receivedAt, 'h:mm a')}</div>
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">To:</span> {email.to}
                </div>
                {email.cc && (
                  <div>
                    <span className="font-medium">CC:</span> {email.cc}
                  </div>
                )}
                {email.bcc && (
                  <div>
                    <span className="font-medium">BCC:</span> {email.bcc}
                  </div>
                )}
              </div>

              {/* Labels */}
              {email.labels && email.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {email.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Attachments indicator */}
              {email.hasAttachments && (
                <div className="flex items-center text-sm text-gray-500 mt-3">
                  <Paperclip className="w-4 h-4 mr-1" />
                  Has attachments
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Summary Card */}
        <div className="px-6 py-4">
          <EmailSummaryCard
            email={{
              id: email.id,
              from: email.from,
              to: email.to,
              subject: email.subject,
              body: email.body,
              snippet: email.snippet,
              date: email.receivedAt.toISOString(),
            }}
            // onSummarize={onAISummarize}
            className="mb-0"
          />
        </div>

        {/* Email body */}
        <div className="p-6">
          {email.htmlBody ? (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: email.htmlBody }}
            />
          ) : email.body ? (
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {email.body}
            </div>
          ) : (
            <div className="text-gray-500 italic">
              Email content not available
            </div>
          )}
        </div>
      </div>

      {/* Reply actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          <Button
            onClick={handleReply}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Reply className="w-4 h-4 mr-2" />
            Reply
          </Button>
          <Button
            variant="outline"
            onClick={handleReplyAll}
          >
            <ReplyAll className="w-4 h-4 mr-2" />
            Reply All
          </Button>
          <Button
            variant="outline"
            onClick={handleForward}
          >
            <Forward className="w-4 h-4 mr-2" />
            Forward
          </Button>
        </div>
        
        <div className="text-xs text-gray-500">
          Received {formatDistanceToNow(email.receivedAt, { addSuffix: true })}
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal 
        open={isComposeOpen} 
        onOpenChange={setIsComposeOpen}
        replyTo={composeType === 'reply' || composeType === 'replyAll' ? {
          to: composeType === 'replyAll' ? [email.from, email.to, email.cc].filter(Boolean).join(', ') : email.from,
          subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
          originalBody: email.body || email.snippet,
        } : undefined}
      />
    </div>
  );
}