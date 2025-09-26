import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const gmail = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const query = searchParams.get('q') || undefined;
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const pageToken = searchParams.get('pageToken') || undefined;

    const messages = await gmail.getMessages(query, maxResults, pageToken);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}