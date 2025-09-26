import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const gmail = await requireAuth();
    const body = await request.json();
    
    const { messageId, replyContent } = body;
    
    if (!messageId || !replyContent) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, replyContent' },
        { status: 400 }
      );
    }
    
    const result = await gmail.replyToEmail(messageId, replyContent);
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.id,
      message: 'Reply sent successfully' 
    });
  } catch (error) {
    console.error('Error replying to email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reply to email' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}