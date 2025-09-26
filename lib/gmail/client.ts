import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GmailService {
  private gmail: gmail_v1.Gmail;
  private auth: OAuth2Client;

  constructor(accessToken: string, refreshToken?: string) {
    this.auth = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    this.auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  // Get list of emails
  async getMessages(query?: string, maxResults = 50, pageToken?: string) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
        pageToken,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages from Gmail');
    }
  }

  // Get specific email by ID
  async getMessage(messageId: string) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return this.parseMessage(response.data);
    } catch (error) {
      console.error('Error fetching message:', error);
      throw new Error('Failed to fetch message from Gmail');
    }
  }

  // Parse Gmail message to our format
  private parseMessage(message: gmail_v1.Schema$Message) {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    let body = '';
    let htmlBody = '';
    
    // Extract body from message parts
    if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    } else if (message.payload?.body?.data) {
      // Simple message without parts
      if (message.payload.mimeType === 'text/plain') {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload.mimeType === 'text/html') {
        htmlBody = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      gmailId: message.id!,
      threadId: message.threadId!,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      cc: getHeader('Cc'),
      bcc: getHeader('Bcc'),
      body,
      htmlBody,
      snippet: message.snippet || '',
      labelIds: message.labelIds || [],
      isRead: !message.labelIds?.includes('UNREAD'),
      isImportant: message.labelIds?.includes('IMPORTANT') || false,
      isStarred: message.labelIds?.includes('STARRED') || false,
      hasAttachments: message.payload?.parts?.some(part => 
        part.filename && part.filename.length > 0
      ) || false,
      receivedAt: new Date(parseInt(message.internalDate || '0')),
    };
  }

  // Get user's labels
  async getLabels() {
    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me',
      });

      return response.data.labels || [];
    } catch (error) {
      console.error('Error fetching labels:', error);
      throw new Error('Failed to fetch labels from Gmail');
    }
  }

  // Send email
  async sendEmail(email: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }) {
    try {
      // Create email message following Python EmailMessage pattern
      const message = {
        to: email.to,
        subject: email.subject,
        body: email.body,
        cc: email.cc,
        bcc: email.bcc,
        isHtml: email.isHtml || false
      };

      // Build the raw email content similar to Python's EmailMessage.as_bytes()
      const emailLines = [];
      
      // Add headers
      emailLines.push(`To: ${message.to}`);
      if (message.cc) emailLines.push(`Cc: ${message.cc}`);
      if (message.bcc) emailLines.push(`Bcc: ${message.bcc}`);
      emailLines.push(`Subject: ${message.subject}`);
      emailLines.push('MIME-Version: 1.0');
      emailLines.push(`Content-Type: ${message.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`);
      emailLines.push('Content-Transfer-Encoding: 7bit');
      
      // Empty line to separate headers from body
      emailLines.push('');
      
      // Add body content
      emailLines.push(message.body);
      
      const emailContent = emailLines.join('\r\n');
      
      // Encode using base64 URL-safe encoding (equivalent to Python's base64.urlsafe_b64encode)
      const encodedMessage = Buffer.from(emailContent, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const createMessage = { raw: encodedMessage };
      
      // Send message (equivalent to Python's service.users().messages().send())
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: createMessage,
      });
      
      console.log(`Message Id: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('An error occurred:', error);
      throw new Error('Failed to send email');
    }
  }

  // Reply to email
  async replyToEmail(originalMessageId: string, replyContent: string) {
    try {
      const originalMessage = await this.gmail.users.messages.get({
        userId: 'me',
        id: originalMessageId,
        format: 'full',
      });

      const headers = originalMessage.data.payload?.headers || [];
      const getHeader = (name: string) => 
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const originalSubject = getHeader('Subject');
      const replySubject = originalSubject.startsWith('Re:') 
        ? originalSubject 
        : `Re: ${originalSubject}`;

      const emailContent = [
        `To: ${getHeader('From')}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${getHeader('Message-ID')}`,
        `References: ${getHeader('References')} ${getHeader('Message-ID')}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        replyContent,
      ].join('\n');

      const encodedEmail = Buffer.from(emailContent).toString('base64url');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId: originalMessage.data.threadId,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error replying to email:', error);
      throw new Error('Failed to reply to email');
    }
  }

  // Modify email labels (archive, mark as read, etc.)
  async modifyMessage(messageId: string, addLabels?: string[], removeLabels?: string[]) {
    try {
      const response = await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: addLabels,
          removeLabelIds: removeLabels,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error modifying message:', error);
      throw new Error('Failed to modify message');
    }
  }

  // Archive email
  async archiveMessage(messageId: string) {
    return this.modifyMessage(messageId, [], ['INBOX']);
  }

  // Mark as read
  async markAsRead(messageId: string) {
    return this.modifyMessage(messageId, [], ['UNREAD']);
  }

  // Mark as unread
  async markAsUnread(messageId: string) {
    return this.modifyMessage(messageId, ['UNREAD'], []);
  }

  // Star message
  async starMessage(messageId: string) {
    return this.modifyMessage(messageId, ['STARRED'], []);
  }

  // Unstar message
  async unstarMessage(messageId: string) {
    return this.modifyMessage(messageId, [], ['STARRED']);
  }

  // Move to trash
  async trashMessage(messageId: string) {
    return this.modifyMessage(messageId, ['TRASH'], ['INBOX']);
  }
}