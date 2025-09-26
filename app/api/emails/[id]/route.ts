import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gmail = await requireAuth();
    const email = await gmail.getMessage(params.id);

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
  { params }: { params: { id: string } }
) {
  try {
    const gmail = await requireAuth();
    const { action } = await request.json();

    let result;
    switch (action) {
      case 'archive':
        result = await gmail.archiveMessage(params.id);
        break;
      case 'read':
        result = await gmail.markAsRead(params.id);
        break;
      case 'unread':
        result = await gmail.markAsUnread(params.id);
        break;
      case 'star':
        result = await gmail.starMessage(params.id);
        break;
      case 'unstar':
        result = await gmail.unstarMessage(params.id);
        break;
      case 'trash':
        result = await gmail.trashMessage(params.id);
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