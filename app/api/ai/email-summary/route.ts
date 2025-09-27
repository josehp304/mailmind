import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email data is required' },
        { status: 400 }
      );
    }
    

    // Create email context for AI analysis
    const emailContent = `
From: ${email.from}
To: ${email.to || 'N/A'}
Subject: ${email.subject}
Date: ${email.date}

Body:
${email.body || email.snippet}
    `.trim();

    const prompt = `Analyze this email and provide a structured summary in JSON format:

${emailContent}

You must respond with ONLY a valid JSON object in this exact format:
{
  "summary": "Brief 2-3 sentence summary of the email content",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "sentiment": "positive|neutral|negative|urgent", 
  "category": "meeting|task|information|question|newsletter|promotion|support|other",
  "actionRequired": true/false,
  "urgencyLevel": 1-5
}

Do not include any other text, explanations, or formatting. Only return valid JSON.`;

    // Call Groq API
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
            content: 'You are a precise email analysis assistant. You must respond with valid JSON only, no additional text or formatting. Analyze emails and return structured data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.1
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', groqResponse.status, errorText);
      throw new Error(`Groq API failed: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const response = groqData.choices[0]?.message?.content || '';
    
    console.log('Raw AI Response:', response);

    // Parse JSON response with better error handling
    let summary;
    try {
      // Clean up the response in case there are any extra characters
      const cleanResponse = response.trim();
      summary = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw response:', response);
      
      // Try to extract JSON from response if it's wrapped in other text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          summary = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Second JSON Parse Error:', secondParseError);
          // Use fallback
          summary = {
            summary: `Email from ${email.from} regarding ${email.subject}. AI analysis temporarily unavailable.`,
            keyPoints: ["Content analysis pending", "Please check email manually"],
            sentiment: "neutral",
            category: "other",
            actionRequired: true,
            urgencyLevel: 2
          };
        }
      } else {
        // Complete fallback
        summary = {
          summary: `Email from ${email.from} regarding ${email.subject}. AI analysis temporarily unavailable.`,
          keyPoints: ["Content analysis pending", "Please check email manually"],
          sentiment: "neutral",
          category: "other", 
          actionRequired: true,
          urgencyLevel: 2
        };
      }
    }

    // Validate and normalize the response
    const validSentiments = ['positive', 'neutral', 'negative', 'urgent'];
    const validCategories = ['meeting', 'task', 'information', 'question', 'newsletter', 'promotion', 'support', 'other'];
    
    // Ensure all required fields are present and valid
    const normalizedSummary = {
      summary: summary.summary || `Email from ${email.from} regarding ${email.subject}`,
      keyPoints: Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0 
        ? summary.keyPoints.slice(0, 5) // Limit to 5 points
        : ["Content analysis pending"],
      sentiment: validSentiments.includes(summary.sentiment) ? summary.sentiment : 'neutral',
      category: validCategories.includes(summary.category) ? summary.category : 'other',
      actionRequired: Boolean(summary.actionRequired),
      urgencyLevel: Math.min(Math.max(parseInt(summary.urgencyLevel) || 2, 1), 5)
    };
    
    console.log('Final normalized summary:', normalizedSummary);

    return NextResponse.json({
      success: true,
      summary: normalizedSummary
    });

  } catch (error) {
    console.error('Error generating email summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate email summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}