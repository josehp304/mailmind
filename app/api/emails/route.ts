import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';
import { DatabaseService } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const gmail = await requireAuth();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const pageToken = searchParams.get('pageToken');
    const sync = searchParams.get('sync') === 'true';

    // Get messages from Gmail
    const messagesResponse = await gmail.getMessages(query || undefined, maxResults, pageToken || undefined);
    
    if (!messagesResponse.messages) {
      return NextResponse.json({ emails: [], nextPageToken: null });
    }

    const emails = [];

    // Fetch full details for each message
    for (const message of messagesResponse.messages) {
      if (message.id) {
        try {
          const fullMessage = await gmail.getMessage(message.id);
          
          // If sync is true, save to database
          if (sync) {
            try {
              // Note: We'll need to get user ID from session cookies for database sync
              // For now, we'll skip database operations until we implement user ID retrieval
              console.log('Database sync not implemented yet for:', fullMessage.gmailId);
            } catch (dbError) {
              console.log('Database error:', dbError);
            }
          }

          emails.push(fullMessage);
        } catch (error) {
          console.error('Error fetching message details:', error);
        }
      }
    }

    return NextResponse.json({
      emails,
      nextPageToken: messagesResponse.nextPageToken,
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === 'Authentication required' ? 'Unauthorized' : 'Failed to fetch emails' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const gmail = await requireAuth();

    const { to, cc, bcc, subject, body, isHtml } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    const result = await gmail.sendEmail({
      to,
      cc,
      bcc,
      subject,
      body,
      isHtml,
    });

    return NextResponse.json({ success: true, messageId: result.id });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === 'Authentication required' ? 'Unauthorized' : 'Failed to send email' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}