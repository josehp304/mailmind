import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gmail = await requireAuth();
    const { id } = await params;
    const email = await gmail.getMessage(id);

    return NextResponse.json({ email });

  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === 'Authentication required' ? 'Unauthorized' : 'Failed to fetch email' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gmail = await requireAuth();
    const { action } = await request.json();
    const { id } = await params;

    let result;
    switch (action) {
      case 'archive':
        result = await gmail.archiveMessage(id);
        break;
      case 'read':
        result = await gmail.markAsRead(id);
        break;
      case 'unread':
        result = await gmail.markAsUnread(id);
        break;
      case 'star':
        result = await gmail.starMessage(id);
        break;
      case 'unstar':
        result = await gmail.unstarMessage(id);
        break;
      case 'trash':
        result = await gmail.trashMessage(id);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: error instanceof Error && error.message === 'Authentication required' ? 'Unauthorized' : 'Failed to update email' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}