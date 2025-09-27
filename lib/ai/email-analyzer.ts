interface EmailAnalysisResult {
  summary: string;
  requiresMeeting: boolean;
  meetingReason?: string;
  suggestedReply: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
}

interface EmailData {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  snippet: string;
  receivedAt: Date;
}

export class EmailAnalyzer {
  private groqApiKey: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY!;
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
  }

  /**
   * Analyzes an email to detect meeting requests, generate summaries, and suggest replies
   */
  async analyzeEmail(email: EmailData): Promise<EmailAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(email);
    
    try {
      const response = await this.callGroqAPI(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Error analyzing email:', error);
      throw new Error('Failed to analyze email');
    }
  }

  /**
   * Builds the prompt for email analysis
   */
  private buildAnalysisPrompt(email: EmailData): string {
    return `Analyze the following email and provide a structured response:

EMAIL DETAILS:
Subject: ${email.subject}
From: ${email.from}
To: ${email.to}
Date: ${email.receivedAt.toISOString()}
Content: ${email.body || email.snippet}

ANALYSIS REQUIREMENTS:
1. Provide a concise summary (2-3 sentences)
2. Determine if this email requires scheduling a meeting (look for phrases like "let's meet", "schedule a call", "available for a meeting", "book time", "discuss this further", etc.)
3. If a meeting is suggested, explain why
4. Generate a professional reply that addresses the main points
5. Assess the sentiment (positive/neutral/negative)
6. Determine urgency level (low/medium/high)

FORMAT YOUR RESPONSE EXACTLY AS:
SUMMARY: [your summary here]

REQUIRES_MEETING: [YES or NO]

MEETING_REASON: [explain why a meeting is needed, or "N/A" if no meeting needed]

SUGGESTED_REPLY: [professional email reply addressing the main points and next steps]

SENTIMENT: [positive/neutral/negative]

URGENCY: [low/medium/high]`;
  }

  /**
   * Calls the GROQ API for email analysis
   */
  private async callGroqAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: [
          {
            role: 'system',
            content: 'You are an AI email assistant that analyzes business emails to detect meeting requests, summarize content, and suggest professional replies. Be thorough but concise in your analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`GROQ API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parses the AI response into structured data
   */
  private parseAnalysisResponse(response: string): EmailAnalysisResult {
    const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=\n\nREQUIRES_MEETING:|$)/);
    const meetingMatch = response.match(/REQUIRES_MEETING:\s*(YES|NO)/);
    const reasonMatch = response.match(/MEETING_REASON:\s*(.+?)(?=\n\nSUGGESTED_REPLY:|$)/);
    const replyMatch = response.match(/SUGGESTED_REPLY:\s*(.+?)(?=\n\nSENTIMENT:|$)/);
    const sentimentMatch = response.match(/SENTIMENT:\s*(positive|neutral|negative)/);
    const urgencyMatch = response.match(/URGENCY:\s*(low|medium|high)/);

    return {
      summary: summaryMatch?.[1]?.trim() || 'Summary not available',
      requiresMeeting: meetingMatch?.[1] === 'YES',
      meetingReason: reasonMatch?.[1]?.trim() === 'N/A' ? undefined : reasonMatch?.[1]?.trim(),
      suggestedReply: replyMatch?.[1]?.trim() || 'Reply not available',
      sentiment: (sentimentMatch?.[1] as 'positive' | 'neutral' | 'negative') || 'neutral',
      urgency: (urgencyMatch?.[1] as 'low' | 'medium' | 'high') || 'low'
    };
  }

  /**
   * Batch analyze multiple emails
   */
  async analyzeMultipleEmails(emails: EmailData[]): Promise<Map<string, EmailAnalysisResult>> {
    const results = new Map<string, EmailAnalysisResult>();
    
    // Process in batches to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(async (email) => {
        try {
          const analysis = await this.analyzeEmail(email);
          results.set(email.id, analysis);
        } catch (error) {
          console.error(`Failed to analyze email ${email.id}:`, error);
          // Store a fallback result
          results.set(email.id, {
            summary: 'Analysis failed',
            requiresMeeting: false,
            suggestedReply: 'Thank you for your email. I will review this and get back to you soon.',
            sentiment: 'neutral',
            urgency: 'low'
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

// Export a singleton instance
export const emailAnalyzer = new EmailAnalyzer();