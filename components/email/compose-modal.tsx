"use client"

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, X, Paperclip, Smile, Sparkles, Wand2 } from "lucide-react";

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    to: string;
    subject: string;
    originalBody?: string;
  };
}

interface EmailForm {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

export function ComposeModal({ open, onOpenChange, replyTo }: ComposeModalProps) {
  const [form, setForm] = useState<EmailForm>({
    to: replyTo?.to || '',
    cc: '',
    bcc: '',
    subject: replyTo?.subject ? `Re: ${replyTo.subject}` : '',
    body: replyTo?.originalBody ? `\n\n--- Original Message ---\n${replyTo.originalBody}` : '',
  });
  
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [showAiHelper, setShowAiHelper] = useState(false);

  const handleInputChange = (field: keyof EmailForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const generateTemplate = async () => {
    if (!aiContext.trim()) {
      alert('Please describe what you want to write about');
      return;
    }

    setGeneratingTemplate(true);
    try {
      const response = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: aiContext,
          tone: 'professional',
          isReply: !!replyTo,
          originalEmail: replyTo?.originalBody,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate template');
      }

      const data = await response.json();
      const template = data.template;

      // Update form with generated content
      if (template.subject && !replyTo) {
        setForm(prev => ({ ...prev, subject: template.subject }));
      }
      setForm(prev => ({ ...prev, body: template.content }));
      
      setShowAiHelper(false);
      setAiContext('');
    } catch (error) {
      console.error('Error generating template:', error);
      alert('Failed to generate AI template');
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const handleSend = async () => {
    if (!form.to || !form.subject || !form.body) {
      alert('Please fill in all required fields (To, Subject, and Body)');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: form.to,
          cc: form.cc || undefined,
          bcc: form.bcc || undefined,
          subject: form.subject,
          body: form.body,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      // Reset form and close modal
      setForm({ to: '', cc: '', bcc: '', subject: '', body: '' });
      onOpenChange(false);
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setForm({ to: '', cc: '', bcc: '', subject: '', body: '' });
    setShowCc(false);
    setShowBcc(false);
    setShowAiHelper(false);
    setAiContext('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            {replyTo ? 'Reply to the selected email' : 'Send a new email message'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To Field */}
          <div className="space-y-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={form.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              className="w-full"
            />
          </div>

          {/* CC/BCC Controls */}
          <div className="flex space-x-4 text-sm">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Add CC
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Add BCC
              </button>
            )}
          </div>

          {/* CC Field */}
          {showCc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cc">CC</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCc(false);
                    handleInputChange('cc', '');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Input
                id="cc"
                type="email"
                placeholder="cc@example.com"
                value={form.cc}
                onChange={(e) => handleInputChange('cc', e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* BCC Field */}
          {showBcc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bcc">BCC</Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowBcc(false);
                    handleInputChange('bcc', '');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Input
                id="bcc"
                type="email"
                placeholder="bcc@example.com"
                value={form.bcc}
                onChange={(e) => handleInputChange('bcc', e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={form.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Message *</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAiHelper(!showAiHelper)}
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI Assistant
              </Button>
            </div>

            {/* AI Helper */}
            {showAiHelper && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">
                      Describe what you want to write
                    </span>
                  </div>
                  <Input
                    placeholder="e.g., Request a meeting about project proposal..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    className="border-purple-200"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAiHelper(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={generateTemplate}
                      disabled={generatingTemplate || !aiContext.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingTemplate ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              id="body"
              placeholder="Type your message here..."
              value={form.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              className="w-full min-h-[200px] resize-none"
            />
          </div>

          {/* Formatting Tools (Future Enhancement) */}
          <div className="flex items-center space-x-2 p-2 border-t border-gray-200">
            <Button variant="ghost" size="sm" disabled>
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Smile className="w-4 h-4" />
            </Button>
            <div className="text-xs text-gray-500">
              Attachments and formatting coming soon
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || !form.to || !form.subject || !form.body}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}