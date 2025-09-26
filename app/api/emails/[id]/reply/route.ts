import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gmail = await requireAuth();
    const { body } = await request.json();
    const { id } = await params;

    if (!body) {
      return NextResponse.json(
        { error: 'Reply body is required' },
        { status: 400 }
      );
    }

    const result = await gmail.replyToEmail(id, body);

    return NextResponse.json({ success: true, messageId: result.id });

  } catch (error) {
    console.error('Error replying to email:', error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === 'Authentication required' ? 'Unauthorized' : 'Failed to reply to email' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}