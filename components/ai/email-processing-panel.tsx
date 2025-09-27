'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Bot, Clock } from 'lucide-react';

interface ProcessingResult {
  emailId: string;
  subject: string;
  analysis: {
    summary: string;
    requiresMeeting: boolean;
    meetingReason?: string;
    suggestedReply: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
  };
  meetingScheduled: boolean;
}

interface ProcessingResponse {
  message: string;
  processed: number;
  results: ProcessingResult[];
}

interface ProcessingStatus {
  meetingRequests: number;
  lastIndexedEmailId: string | null;
}

export function EmailProcessingPanel() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processEmails = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/emails/process', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ProcessingResponse = await response.json();
      setResults(data.results);
      
      // Refresh status after processing
      await fetchStatus();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/emails/process');
      if (response.ok) {
        const statusData: ProcessingStatus = await response.json();
        setStatus(statusData);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  // Fetch status on component mount
  useState(() => {
    fetchStatus();
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Email Processing
          </CardTitle>
          <CardDescription>
            Automatically analyze emails, detect meeting requests, and create calendar events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Overview */}
            {status && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    <strong>{status.meetingRequests}</strong> emails need meetings
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">
                    Last processed: {status.lastIndexedEmailId ? 'Recently' : 'Never'}
                  </span>
                </div>
              </div>
            )}

            {/* Process Button */}
            <Button 
              onClick={processEmails} 
              disabled={processing}
              className="w-full"
            >
              {processing ? 'Processing...' : 'Process New Emails'}
            </Button>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">Error: {error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Processing Results ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div 
                  key={result.emailId} 
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">
                        {result.subject}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {result.analysis.summary}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant="secondary" 
                        className={getSentimentColor(result.analysis.sentiment)}
                      >
                        {result.analysis.sentiment}
                      </Badge>
                      <Badge 
                        variant="secondary"
                        className={getUrgencyColor(result.analysis.urgency)}
                      >
                        {result.analysis.urgency}
                      </Badge>
                    </div>
                  </div>

                  {/* Meeting Status */}
                  {result.analysis.requiresMeeting && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Meeting Required
                        </span>
                        {result.meetingScheduled && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Scheduled ✓
                          </Badge>
                        )}
                      </div>
                      {result.analysis.meetingReason && (
                        <p className="text-xs text-blue-700 mt-1">
                          {result.analysis.meetingReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Suggested Reply Preview */}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      View suggested reply
                    </summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded border text-xs">
                      {result.analysis.suggestedReply}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}