'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  CheckCircle,
  MessageCircle,
  Tag
} from 'lucide-react';

export interface EmailSummary {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  category: string;
  actionRequired: boolean;
  urgencyLevel: number;
}

interface EmailSummaryCardProps {
  email: {
    id: string;
    from: string;
    to?: string;
    subject: string;
    body?: string;
    snippet: string;
    date: string;
  };
  onSummarize?: () => void;
  className?: string;
}

export function EmailSummaryCard({ email, onSummarize, className = '' }: EmailSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/email-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      onSummarize?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI summary');
      console.error('Summary generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getUrgencyBadge = (level: number) => {
    if (level >= 4) return <Badge variant="destructive" className="text-xs">High Priority</Badge>;
    if (level >= 3) return <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">Medium Priority</Badge>;
    return <Badge variant="secondary" className="text-xs">Low Priority</Badge>;
  };

  if (!summary && !isLoading && !error) {
    return (
      <Card className={`border-gray-200 bg-gray-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">AI Summary Available</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateSummary}
              disabled={isLoading}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Generate Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Generating AI summary...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">{error}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateSummary}
              disabled={isLoading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card className={`${getSentimentColor(summary.sentiment)} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <CardTitle className="text-lg">AI Summary</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {summary.actionRequired && (
              <Badge variant="outline" className="text-xs border-green-300 text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Action Required
              </Badge>
            )}
            {getUrgencyBadge(summary.urgencyLevel)}
            <Badge variant="secondary" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {summary.category}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription className="text-gray-700">
          {summary.summary}
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {summary.keyPoints && summary.keyPoints.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Key Points</h4>
                <ul className="space-y-2">
                  {summary.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {summary.sentiment.charAt(0).toUpperCase() + summary.sentiment.slice(1)}
                </span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateSummary}
                disabled={isLoading}
                className="text-current border-current/30 hover:bg-current/10"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}