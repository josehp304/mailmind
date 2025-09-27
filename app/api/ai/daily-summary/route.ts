import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST endpoint - Generate daily summary using AI
export async function POST(request: NextRequest) {
  try {
    // Get authentication tokens from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({
        summary: {
          summary: "No emails to summarize.",
          keyPoints: [],
          urgentEmails: 0,
          totalEmails: 0,
          snippet: "No emails available"
        }
      });
    }

    // Create email context for GROQ
    const emailsContext = emails.map((email, index) => 
      `${index + 1}. From: ${email.from}\nSubject: ${email.subject}\nPreview: ${email.snippet}\nStatus: ${email.isUnread ? 'Unread' : 'Read'}`
    ).join('\n\n');

    const prompt = `Analyze these ${emails.length} emails and provide a concise summary:

${emailsContext}

Please provide:
1. A brief overview summary (2-3 sentences)
2. Key bullet points of important topics/themes
3. Count of potentially urgent/important emails
4. A very short snippet (10-15 words) for preview

Format your response as:
SUMMARY: [2-3 sentence overview]

KEY POINTS:
• [point 1]
• [point 2]
• [point 3]

URGENT COUNT: [number]

SNIPPET: [short preview]`;

    // Direct GROQ API call
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: [
          {
            role: 'system',
            content: 'You are an AI email assistant. Analyze emails and provide concise, actionable summaries. make it a few sentence long with metrics like leads, meeting emails, follow ups, and urgent emails, news, ad'
          },
          {
            role: 'user',
            content: prompt
          } 
        ],
        temperature: 0.3,
      }),
    });

    if (!groqResponse.ok) {
      throw new Error(`GROQ API failed: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const response = groqData.choices[0]?.message?.content || '';

    // Parse the response
    const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=\n\nKEY POINTS:|$)/);
    const keyPointsMatch = response.match(/KEY POINTS:\s*([\s\S]+?)(?=\n\nURGENT COUNT:|$)/);
    const urgentMatch = response.match(/URGENT COUNT:\s*(\d+)/);
    const snippetMatch = response.match(/SNIPPET:\s*(.+?)(?=\n|$)/);

    const summary = summaryMatch?.[1]?.trim() || 'Summary not available';
    const keyPointsText = keyPointsMatch?.[1]?.trim() || '';
    const keyPoints = keyPointsText
      .split('\n')
      .filter((point: string) => point.trim().startsWith('•'))
      .map((point: string) => point.replace('•', '').trim())
      .filter(Boolean);
    
    const urgentEmails = urgentMatch ? parseInt(urgentMatch[1]) : 0;
    const snippet = snippetMatch?.[1]?.trim() || `${emails.length} emails processed`;

    return NextResponse.json({
      summary: {
        summary,
        keyPoints,
        urgentEmails,
        totalEmails: emails.length,
        snippet
      }
    });
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

// GET endpoint - Load daily summary from database (temporarily disabled)
export async function GET(request: NextRequest) {
  try {
    // Get authentication tokens from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Database operations temporarily disabled due to UUID constraints
    // Return null to indicate no cached summary available
    return NextResponse.json({ summary: null });

  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}

// PUT endpoint - Save daily summary to database (temporarily disabled)
export async function PUT(request: NextRequest) {
  try {
    // Get authentication tokens from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await request.json();
    
    // Database operations temporarily disabled due to UUID constraints
    // Return the summary without saving to database
    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Error saving daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to save summary' },
      { status: 500 }
    );
  }
}