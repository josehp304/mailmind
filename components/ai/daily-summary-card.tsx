'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Sparkles, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDailySummary } from '@/lib/context/daily-summary-context';

export interface EmailSummary {
  id?: string;
  summary: string;
  keyPoints: string[];
  urgentEmails: number;
  totalEmails: number;
  snippet: string;
  date?: string;
  lastEmailId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DailySummaryCardProps {
  emails: Array<{
    id: string;
    from: string;
    subject: string;
    snippet: string;
    date: string;
    isUnread?: boolean;
  }>;
  onRefresh?: () => void;
}

export function DailySummaryCard({ emails, onRefresh }: DailySummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    dailySummary, 
    loading, 
    error, 
    refreshSummary, 
    isStale 
  } = useDailySummary();

  const handleRefreshClick = async () => {
    await refreshSummary(undefined, true); // Force refresh for current date
    onRefresh?.();
  };

  if (loading) {
    return (
      <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Generating AI summary...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !dailySummary) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-600">
                {error || 'No AI summary available'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refreshSummary(undefined, true)}
              disabled={loading}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50" 
    onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">AI Summary</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {dailySummary.urgentCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {dailySummary.urgentCount} urgent
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {dailySummary.totalCount} emails
            </Badge>
            {isStale && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                <RefreshCw className="w-3 h-3 mr-1" />
                Updates available
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              
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
          {dailySummary.snippet}
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">Summary</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {dailySummary.summary}
              </p>
            </div>

            {dailySummary.keyPoints.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {dailySummary.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshClick}
                disabled={loading}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Refresh Summary
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}