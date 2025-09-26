import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/gmail/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const gmail = await requireAuth();
    const body = await request.json();
    
    const { to, cc, bcc, subject, body: emailBody, isHtml } = body;
    
    if (!to || !subject || !emailBody) {
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
      body: emailBody,
      isHtml
    });
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.id,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}