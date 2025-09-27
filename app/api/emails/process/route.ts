import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DatabaseService } from '@/lib/db/queries';
import { emailAnalyzer } from '@/lib/ai/email-analyzer';
import { googleCalendarService } from '@/lib/ai/calendar-service';
import { gmail_v1, google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    // Get authentication tokens from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Gmail authorization required' }, 
        { status: 401 }
      );
    }

    // For now, we'll use a hardcoded user ID - in production, this should come from session
    // TODO: Implement proper user identification from session/JWT
    const userId = 'temp-user-id'; // This needs to be replaced with actual user identification

    // Set up Gmail API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get list of recent emails
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: 'is:unread OR newer_than:1d', // Recent unread or from last day
    });

    if (!messagesResponse.data.messages) {
      return NextResponse.json({ 
        message: 'No new emails to process',
        processed: 0 
      });
    }

    const messageIds = messagesResponse.data.messages.map(m => m.id!);
    
    // Get last indexed email ID to only process newer emails
    const lastIndexedId = await DatabaseService.getLastIndexedEmailId(userId);
    console.log('Last indexed email ID:', lastIndexedId);

    let processedCount = 0;
    let newEmails: any[] = [];

    // Fetch email details and filter for new emails
    for (const messageId of messageIds) {
      try {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        const message = messageResponse.data;
        const emailData = parseGmailMessage(message);

        // Skip if this is the last indexed email or older
        if (lastIndexedId && messageId <= lastIndexedId) {
          continue;
        }

        // Check if we already processed this email
        const existingResult = await DatabaseService.getEmailProcessingResult(userId, messageId);
        if (existingResult) {
          continue;
        }

        // Save email to database if not exists
        let savedEmail;
        try {
          savedEmail = await DatabaseService.saveEmail({
            userId,
            gmailId: messageId,
            ...emailData,
          });
        } catch (error) {
          // Email might already exist, try to get it
          const emails = await DatabaseService.getUserEmails(userId);
          savedEmail = emails.find(e => e.gmailId === messageId);
          if (!savedEmail) {
            console.error('Failed to save/find email:', error);
            continue;
          }
        }

        newEmails.push({
          id: messageId,
          emailId: savedEmail.id,
          ...emailData,
        });

      } catch (error) {
        console.error(`Error processing message ${messageId}:`, error);
        continue;
      }
    }

    console.log(`Found ${newEmails.length} new emails to process`);

    // Process new emails with AI
    const processingResults = [];
    
    for (const email of newEmails) {
      try {
        // Analyze email with AI
        const analysis = await emailAnalyzer.analyzeEmail({
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.to,
          body: email.body || email.snippet,
          snippet: email.snippet,
          receivedAt: email.receivedAt,
        });

        console.log(`Analysis result for ${email.subject}:`, analysis);

        // Save processing result
        const processingResult = await DatabaseService.saveEmailProcessingResult({
          userId,
          emailId: email.emailId,
          gmailId: email.id,
          summary: analysis.summary,
          requiresMeeting: analysis.requiresMeeting,
          meetingReason: analysis.meetingReason,
          suggestedReply: analysis.suggestedReply,
          processingStatus: 'analyzed',
        });

        // If meeting is required, create calendar event
        if (analysis.requiresMeeting && analysis.meetingReason) {
          try {
            const calendarEvent = await googleCalendarService.createMeetingEvent(
              accessToken,
              refreshToken,
              {
                subject: email.subject,
                fromEmail: email.from,
                toEmail: email.to,
                meetingReason: analysis.meetingReason,
                duration: 30, // Default 30 minutes
              }
            );

            console.log('Created calendar event:', calendarEvent);

            // Update processing result with calendar info
            await DatabaseService.updateEmailProcessingResult(
              userId,
              email.id,
              {
                calendarEventId: calendarEvent.id,
                calendarEventLink: calendarEvent.meetingLink,
                processingStatus: 'meeting_scheduled',
              }
            );

          } catch (calendarError) {
            console.error('Failed to create calendar event:', calendarError);
            await DatabaseService.updateEmailProcessingResult(
              userId,
              email.id,
              { processingStatus: 'calendar_failed' }
            );
          }
        }

        // Create draft reply
        try {
          const draftResponse = await gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
              message: {
                threadId: email.threadId,
                raw: createRawReply(email, analysis.suggestedReply, 'user@example.com'), // TODO: Get actual user email
              },
            },
          });

          const draftId = draftResponse.data.id || '';
          console.log('Created draft reply:', draftId);

          // Update processing result with draft info
          await DatabaseService.updateEmailProcessingResult(
            userId,
            email.id,
            {
              replyDraftId: draftId || undefined,
              processingStatus: analysis.requiresMeeting ? 
                (processingResult.processingStatus || 'draft_created') : 'draft_created',
            }
          );

        } catch (draftError) {
          console.error('Failed to create draft:', draftError);
        }

        processingResults.push({
          emailId: email.id,
          subject: email.subject,
          analysis,
          meetingScheduled: analysis.requiresMeeting,
        });

        processedCount++;

      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        // Save error status
        await DatabaseService.saveEmailProcessingResult({
          userId,
          emailId: email.emailId,
          gmailId: email.id,
          processingStatus: 'error',
        });
      }
    }

    // Update last indexed email ID
    if (newEmails.length > 0) {
      const latestEmailId = newEmails[0].id; // They should be sorted by date
      await DatabaseService.updateLastIndexedEmail(userId, latestEmailId);
    }

    return NextResponse.json({
      message: `Successfully processed ${processedCount} emails`,
      processed: processedCount,
      results: processingResults,
    });

  } catch (error) {
    console.error('Error in email processing:', error);
    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    );
  }
}

// Helper function to parse Gmail message
function parseGmailMessage(message: gmail_v1.Schema$Message) {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) => 
    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  let body = '';
  let htmlBody = '';

  // Extract body content
  const extractBody = (payload: gmail_v1.Schema$MessagePart): void => {
    if (payload.body?.data) {
      const content = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/plain') {
        body += content;
      } else if (payload.mimeType === 'text/html') {
        htmlBody += content;
      }
    }

    if (payload.parts) {
      payload.parts.forEach(extractBody);
    }
  };

  if (message.payload) {
    extractBody(message.payload);
  }

  return {
    subject: getHeader('Subject'),
    from: getHeader('From'),
    to: getHeader('To'),
    cc: getHeader('Cc'),
    body: body || undefined,
    htmlBody: htmlBody || undefined,
    snippet: message.snippet || '',
    receivedAt: new Date(parseInt(message.internalDate || '0')),
    isRead: !message.labelIds?.includes('UNREAD'),
    isImportant: message.labelIds?.includes('IMPORTANT') || false,
    isStarred: message.labelIds?.includes('STARRED') || false,
    hasAttachments: message.payload?.parts?.some(p => p.filename) || false,
    threadId: message.threadId || message.id || '',
  };
}

// Helper function to create raw email reply
function createRawReply(
  originalEmail: any,
  replyContent: string,
  fromEmail: string
): string {
  const to = originalEmail.from;
  const subject = originalEmail.subject.startsWith('Re: ') 
    ? originalEmail.subject 
    : `Re: ${originalEmail.subject}`;

  const email = [
    `To: ${to}`,
    `From: ${fromEmail}`,
    `Subject: ${subject}`,
    `In-Reply-To: ${originalEmail.id}`,
    `References: ${originalEmail.id}`,
    '',
    replyContent,
    '',
    '---',
    `This reply was generated by AI based on the email analysis.`,
  ].join('\r\n');

  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

// GET endpoint to check processing status
export async function GET(request: NextRequest) {
  try {
    // Get authentication tokens from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, we'll use a hardcoded user ID - in production, this should come from session
    const userId = 'temp-user-id';

    // Get emails that need meetings
    const meetingEmails = await DatabaseService.getEmailsNeedingMeeting(userId);
    
    return NextResponse.json({
      meetingRequests: meetingEmails.length,
      lastIndexedEmailId: await DatabaseService.getLastIndexedEmailId(userId),
    });

  } catch (error) {
    console.error('Error getting processing status:', error);
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    );
  }
}