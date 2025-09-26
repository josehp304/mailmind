import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gmail = await requireAuth();
    const { id } = await params;
    const messageId = id;
    
    const message = await gmail.getMessage(messageId);
    
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch message' },
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
    const { id } = await params;
    const messageId = id;
    const body = await request.json();
    
    const { action, addLabels, removeLabels } = body;
    
    let result;
    switch (action) {
      case 'archive':
        result = await gmail.archiveMessage(messageId);
        break;
      case 'markRead':
        result = await gmail.markAsRead(messageId);
        break;
      case 'markUnread':
        result = await gmail.markAsUnread(messageId);
        break;
      case 'star':
        result = await gmail.starMessage(messageId);
        break;
      case 'unstar':
        result = await gmail.unstarMessage(messageId);
        break;
      case 'trash':
        result = await gmail.trashMessage(messageId);
        break;
      case 'modify':
        result = await gmail.modifyMessage(messageId, addLabels, removeLabels);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error modifying message:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to modify message' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}