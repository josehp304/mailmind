# Email Processing System Documentation

This document describes the AI-powered email processing system that automatically detects meeting requests, creates calendar events, generates replies, and tracks processed emails.

## Features

✅ **AI Email Analysis**: Uses GROQ AI to analyze emails and detect:
- Meeting requests and scheduling needs
- Email sentiment and urgency levels
- Key topics and action items
- Appropriate reply suggestions

✅ **Smart Meeting Detection**: Identifies emails that require scheduling meetings based on phrases like:
- "let's meet"
- "schedule a call"
- "available for a meeting"
- "book time"
- "discuss this further"

✅ **Automatic Calendar Integration**: When meetings are detected:
- Creates Google Calendar events automatically
- Finds available time slots in your calendar
- Includes meeting details and Google Meet links
- Sends calendar invites to participants

✅ **Draft Reply Generation**: Creates professional draft replies that:
- Address the main points of the email
- Include meeting scheduling if needed
- Maintain appropriate tone and professionalism

✅ **Email Indexing**: Tracks processed emails to avoid duplicates:
- Only processes new emails since last run
- Stores processing results in database
- Maintains processing status for each email

## API Endpoints

### POST `/api/emails/process`

Processes new emails and applies AI analysis.

**Authentication**: Requires Gmail OAuth tokens in cookies
- `access_token`: Google OAuth access token
- `refresh_token`: Google OAuth refresh token

**Response Example**:
```json
{
  "message": "Successfully processed 5 emails",
  "processed": 5,
  "results": [
    {
      "emailId": "gmail_id_123",
      "subject": "Project Discussion Meeting",
      "analysis": {
        "summary": "Client wants to discuss project timeline and deliverables.",
        "requiresMeeting": true,
        "meetingReason": "Project timeline discussion requested",
        "suggestedReply": "Thank you for your email. I've scheduled a meeting to discuss the project timeline...",
        "sentiment": "positive",
        "urgency": "medium"
      },
      "meetingScheduled": true
    }
  ]
}
```

### GET `/api/emails/process`

Returns processing status and statistics.

**Response Example**:
```json
{
  "meetingRequests": 3,
  "lastIndexedEmailId": "gmail_id_789"
}
```

## Database Schema

### email_processing_results

Stores AI analysis results for each processed email:

```sql
CREATE TABLE email_processing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  email_id UUID NOT NULL REFERENCES emails(id),
  gmail_id VARCHAR(255) NOT NULL,
  summary TEXT,
  requires_meeting BOOLEAN DEFAULT FALSE,
  meeting_reason TEXT,
  suggested_reply TEXT,
  reply_draft_id VARCHAR(255),
  calendar_event_id VARCHAR(255),
  calendar_event_link TEXT,
  processing_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### users table updates

Added tracking for last processed email:

```sql
ALTER TABLE users ADD COLUMN last_indexed_email_id VARCHAR(255);
```

## Processing Status Values

- `pending`: Email queued for processing
- `analyzed`: AI analysis completed
- `draft_created`: Reply draft created in Gmail
- `meeting_scheduled`: Calendar event created successfully
- `calendar_failed`: Calendar event creation failed
- `error`: Processing failed

## Configuration

### Environment Variables

Required environment variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Processing
GROQ_API_KEY=your_groq_api_key

# Database
DATABASE_URL=your_neon_postgres_url
```

### Google Calendar Permissions

The system requires the following Google Calendar API scopes:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

### Gmail API Permissions

Required Gmail API scopes:
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.compose`

## Usage Examples

### Manual Processing Trigger

```javascript
// Trigger email processing
const response = await fetch('/api/emails/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
console.log(`Processed ${result.processed} emails`);
```

### Check Processing Status

```javascript
// Get current processing status
const response = await fetch('/api/emails/process');
const status = await response.json();
console.log(`${status.meetingRequests} emails need meetings`);
```

### Automated Processing

You can set up automated processing using:
1. **Cron Jobs**: Run processing every 15 minutes
2. **Webhooks**: Gmail push notifications (advanced)
3. **Scheduled Functions**: Vercel cron or similar

Example cron setup:
```bash
# Process emails every 15 minutes
*/15 * * * * curl -X POST https://your-app.com/api/emails/process
```

## AI Analysis Details

### Meeting Detection Patterns

The AI looks for these indicators:
- Direct requests: "let's schedule a meeting"
- Time references: "next week", "tomorrow"
- Discussion needs: "we need to talk about"
- Planning words: "schedule", "arrange", "organize"
- Availability questions: "when are you free?"

### Reply Generation

Replies are generated with:
- Professional tone matching user preferences
- Context awareness from email content
- Meeting scheduling language when appropriate
- Clear next steps and action items

### Calendar Scheduling Logic

1. **Time Detection**: Parses email for time preferences
2. **Availability Check**: Queries Google Calendar for conflicts
3. **Smart Scheduling**: Finds next available 30-60 minute slot
4. **Business Hours**: Defaults to 9 AM - 5 PM weekdays
5. **Meeting Creation**: Includes description and Meet link

## Troubleshooting

### Common Issues

**Authentication Errors**:
- Verify OAuth tokens are valid and not expired
- Check Google OAuth 2.0 configuration
- Ensure required scopes are granted

**Calendar Creation Fails**:
- Verify Calendar API is enabled
- Check user has calendar write permissions
- Ensure calendar exists and is accessible

**AI Analysis Errors**:
- Check GROQ API key is valid
- Monitor API rate limits
- Verify network connectivity

**Database Connection Issues**:
- Confirm Neon database URL is correct
- Check database permissions
- Verify table schemas exist

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=mailmind:*
```

### Rate Limiting

The system includes built-in rate limiting:
- Max 3 emails processed simultaneously
- 1 second delay between batches
- Graceful handling of API limits

## Future Enhancements

Planned features:
- [ ] Custom meeting duration detection
- [ ] Multiple calendar support
- [ ] Advanced scheduling preferences
- [ ] Integration with other calendar systems
- [ ] Sentiment-based priority scoring
- [ ] Custom reply templates
- [ ] Meeting type classification
- [ ] Automatic follow-up reminders

## Security Considerations

- OAuth tokens stored securely in HTTP-only cookies
- Database queries use parameterized statements
- Email content processed with privacy in mind
- Calendar events include minimal personal information
- Processing results can be purged automatically