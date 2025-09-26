import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, tone = 'professional', isReply = false, originalEmail } = body;

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    const prompt = isReply 
      ? `Generate a ${tone} email reply based on this context: "${context}"\nOriginal email: "${originalEmail}"\n\nPlease provide:\n1. A suggested email response that addresses the main points\n2. Keep it ${tone} in tone\n3. Make it concise and clear\n4. Return only the email body content, no subject line needed for replies`
      : `Generate a ${tone} email template based on this context: "${context}"\n\nPlease provide:\n1. A suggested subject line\n2. Email body content that is ${tone} in tone\n3. Make it concise and actionable\n4. Format as a complete email template\n\nFormat your response as:\nSubject: [subject line]\n\n[email body]`;

    // Direct GROQ API call
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an AI email assistant. Generate professional, concise, and contextually appropriate email content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!groqResponse.ok) {
      throw new Error(`GROQ API failed: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const response = groqData.choices[0]?.message?.content || '';

    if (isReply) {
      return NextResponse.json({ 
        template: {
          content: response.trim(),
          tone
        }
      });
    }

    // Parse subject and content for new emails
    const lines = response.split('\n');
    const subjectLine = lines.find((line: string) => line.startsWith('Subject:'));
    const subject = subjectLine ? subjectLine.replace('Subject:', '').trim() : '';
    
    // Get content after subject line
    const subjectIndex = lines.findIndex((line: string) => line.startsWith('Subject:'));
    const content = lines
      .slice(subjectIndex + 1)
      .join('\n')
      .trim()
      .replace(/^\n+/, ''); // Remove leading newlines

    return NextResponse.json({ 
      template: {
        subject,
        content,
        tone
      }
    });
  } catch (error) {
    console.error('Error generating email template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}