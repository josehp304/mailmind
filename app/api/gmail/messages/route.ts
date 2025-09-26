import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const gmail = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const query = searchParams.get('q') || undefined;
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const pageToken = searchParams.get('pageToken') || undefined;

    // Get message list first
    const messagesResponse = await gmail.getMessages(query, maxResults, pageToken);
    
    if (!messagesResponse.messages || messagesResponse.messages.length === 0) {
      return NextResponse.json({ 
        messages: [], 
        nextPageToken: messagesResponse.nextPageToken || null 
      });
    }

    // Fetch full details for each message
    const detailedMessages = [];
    for (const message of messagesResponse.messages) {
      if (message.id) {
        try {
          const fullMessage = await gmail.getMessage(message.id);
          detailedMessages.push(fullMessage);
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          // Skip this message but continue with others
        }
      }
    }
    
    return NextResponse.json({
      messages: detailedMessages,
      nextPageToken: messagesResponse.nextPageToken || null
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}