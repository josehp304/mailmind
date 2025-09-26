'use client';

import React, { useState, useEffect } from 'react';
import { EmailList } from './email-list';
import { EmailToolbar } from './email-toolbar';

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body?: string;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  receivedAt: Date;
  labels?: string[];
}

interface InboxViewProps {
  category?: string;
  searchQuery?: string;
  onEmailSelect?: (email: Email) => void;
  className?: string;
}

// Mock data for demonstration
const mockEmails: Email[] = [
  {
    id: '1',
    from: 'John Doe <john@example.com>',
    to: 'you@example.com',
    subject: 'Important Meeting Tomorrow',
    body: `Hi there,

I wanted to confirm our meeting scheduled for tomorrow at 10 AM. We'll be discussing the Q4 project roadmap and budget allocation.

The meeting will be held in Conference Room B on the 3rd floor. Please bring your laptop and any relevant project documents.

Looking forward to seeing you there!

Best regards,
John Doe
Project Manager`,
    snippet: 'Hi there, I wanted to confirm our meeting scheduled for tomorrow at 10 AM. Please let me know if you need to reschedule.',
    isRead: false,
    isStarred: true,
    isImportant: true,
    hasAttachments: false,
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    labels: ['Work', 'Urgent'],
  },
  {
    id: '2',
    from: 'Sarah Wilson <sarah@company.com>',
    to: 'you@example.com',
    subject: 'Project Update - Q4 Progress',
    body: `Hello team,

The Q4 project is progressing well. Here's our current status:

✅ Phase 1: Requirements gathering (100% complete)
✅ Phase 2: Design mockups (100% complete)
🔄 Phase 3: Development (75% complete)
📅 Phase 4: Testing (Starting next week)
📅 Phase 5: Deployment (Scheduled for Dec 15)

We have completed 75% of the milestones and are on track for the December deadline. The development team has been working efficiently, and we expect to finish the core features by next Friday.

Please find the detailed progress report attached.

Best,
Sarah Wilson
Senior Project Manager`,
    snippet: 'The Q4 project is progressing well. We have completed 75% of the milestones and are on track for the December deadline.',
    isRead: true,
    isStarred: false,
    isImportant: false,
    hasAttachments: true,
    receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    labels: ['Work'],
  },
  {
    id: '3',
    from: 'Netflix <info@netflix.com>',
    to: 'you@example.com',
    subject: 'New shows this week',
    body: `🎬 What's New This Week

Check out the latest shows and movies added to Netflix this week:

NEW SERIES:
• "Mystery of the Lost City" - Adventure Drama
• "Tech Titans" - Documentary Series
• "Cooking with Love" - Reality Show

NEW MOVIES:
• "The Last Journey" - Action Thriller
• "Romantic Escape" - Romance Comedy
• "Space Odyssey 2024" - Sci-Fi Adventure

From thrilling documentaries to romantic comedies, there's something for everyone!

Happy watching! 🍿

The Netflix Team`,
    snippet: 'Check out the latest shows and movies added to Netflix this week. From thrilling documentaries to romantic comedies.',
    isRead: true,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    labels: ['Promotions'],
  },
  {
    id: '4',
    from: 'Tech Recruiter <recruiter@techcorp.com>',
    to: 'you@example.com',
    subject: 'Exciting opportunity at TechCorp',
    body: `Dear Developer,

I hope this email finds you well. I came across your profile and was impressed by your technical background and experience.

We have an exciting Senior Developer position at TechCorp that I believe would be a perfect match for your skills:

POSITION DETAILS:
• Role: Senior Full-Stack Developer
• Location: San Francisco, CA (Remote options available)
• Salary: $120k - $160k + equity
• Benefits: Comprehensive health insurance, 401k matching, unlimited PTO

KEY REQUIREMENTS:
• 5+ years of experience with React, Node.js
• Strong background in cloud technologies (AWS/Azure)
• Experience with agile development methodologies

The role offers competitive salary, remote work options, and the opportunity to work with cutting-edge technologies in a fast-growing company.

Would you be interested in learning more about this opportunity? I'd love to schedule a brief call to discuss the details.

Best regards,
Amanda Smith
Senior Technical Recruiter
TechCorp Solutions`,
    snippet: 'We have an exciting Senior Developer position that matches your profile. The role offers competitive salary and remote work options.',
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    labels: ['Cold Emails'],
  },
  {
    id: '5',
    from: 'Bank Alert <alerts@bank.com>',
    to: 'you@example.com',
    subject: 'Your account statement is ready',
    body: `Important Account Notice

Dear Valued Customer,

Your monthly account statement for October 2024 is now available for download.

ACCOUNT SUMMARY:
• Account Number: ****1234
• Statement Period: Oct 1 - Oct 31, 2024
• Beginning Balance: $2,450.00
• Ending Balance: $3,120.50
• Total Deposits: $4,500.00
• Total Withdrawals: $3,829.50

You can view and download your complete statement by logging into your online banking account or using our mobile app.

IMPORTANT REMINDERS:
• Review your statement for any unauthorized transactions
• Report any discrepancies within 60 days
• Keep your statements for tax and financial records

If you have any questions about your account or need assistance, please don't hesitate to contact our customer service team at 1-800-BANK-123.

Thank you for banking with us.

Sincerely,
Customer Service Team
First National Bank`,
    snippet: 'Your monthly account statement for October is now available. You can view and download it from your online banking.',
    isRead: true,
    isStarred: false,
    isImportant: true,
    hasAttachments: true,
    receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    labels: ['Important'],
  },
];

export function InboxView({ category = 'inbox', searchQuery, onEmailSelect, className }: InboxViewProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectedEmailId, setSelectedEmailId] = useState<string>();

  // Filter emails based on category and search query
  const filteredEmails = React.useMemo(() => {
    let filtered = mockEmails;

    // Filter by category
    switch (category) {
      case 'starred':
        filtered = filtered.filter(email => email.isStarred);
        break;
      case 'important':
        filtered = filtered.filter(email => email.isImportant);
        break;
      case 'sent':
        // In a real app, this would fetch sent emails
        filtered = [];
        break;
      case 'drafts':
        // In a real app, this would fetch draft emails
        filtered = [];
        break;
      case 'spam':
        // In a real app, this would fetch spam emails
        filtered = [];
        break;
      case 'trash':
        // In a real app, this would fetch trashed emails
        filtered = [];
        break;
      case 'promotions':
        filtered = filtered.filter(email => 
          email.labels?.includes('Promotions')
        );
        break;
      case 'cold-emails':
        filtered = filtered.filter(email => 
          email.labels?.includes('Cold Emails')
        );
        break;
      default: // inbox
        filtered = filtered.filter(email => 
          !email.labels?.includes('Spam') && 
          !email.labels?.includes('Trash')
        );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        email.from.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.snippet.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [category, searchQuery]);

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    const timer = setTimeout(() => {
      setEmails(filteredEmails);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [filteredEmails]);

  const handleEmailSelect = (email: Email) => {
    setSelectedEmailId(email.id);
    onEmailSelect?.(email);
  };

  const handleEmailStar = (emailId: string) => {
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId
          ? { ...email, isStarred: !email.isStarred }
          : email
      )
    );
  };

  const handleEmailArchive = (emailId: string) => {
    // In a real app, this would call the archive API
    setEmails(prev => prev.filter(email => email.id !== emailId));
  };

  const handleEmailDelete = (emailId: string) => {
    // In a real app, this would call the delete API
    setEmails(prev => prev.filter(email => email.id !== emailId));
  };

  const handleEmailToggleImportant = (emailId: string) => {
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId
          ? { ...email, isImportant: !email.isImportant }
          : email
      )
    );
  };

  const handleSelectAll = () => {
    setSelectedEmails(new Set(emails.map(email => email.id)));
  };

  const handleDeselectAll = () => {
    setSelectedEmails(new Set());
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setEmails([...mockEmails]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={className}>
      <EmailToolbar
        selectedCount={selectedEmails.size}
        totalCount={emails.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onRefresh={handleRefresh}
        onArchiveSelected={() => {
          // Bulk archive selected emails
          setEmails(prev => 
            prev.filter(email => !selectedEmails.has(email.id))
          );
          setSelectedEmails(new Set());
        }}
        onDeleteSelected={() => {
          // Bulk delete selected emails
          setEmails(prev => 
            prev.filter(email => !selectedEmails.has(email.id))
          );
          setSelectedEmails(new Set());
        }}
        onStarSelected={() => {
          // Bulk star selected emails
          setEmails(prev =>
            prev.map(email =>
              selectedEmails.has(email.id)
                ? { ...email, isStarred: true }
                : email
            )
          );
        }}
        onMarkImportant={() => {
          // Bulk mark as important
          setEmails(prev =>
            prev.map(email =>
              selectedEmails.has(email.id)
                ? { ...email, isImportant: true }
                : email
            )
          );
        }}
      />
      
      <EmailList
        emails={emails}
        selectedEmailId={selectedEmailId}
        onEmailSelect={handleEmailSelect}
        onEmailStar={handleEmailStar}
        onEmailArchive={handleEmailArchive}
        onEmailDelete={handleEmailDelete}
        onEmailToggleImportant={handleEmailToggleImportant}
        loading={loading}
      />
    </div>
  );
}