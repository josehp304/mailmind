'use client';

import { ReactNode } from 'react';
import { SessionProvider } from '@/lib/auth/session';
import { EmailProvider } from '@/lib/context/email-context';
import { DailySummaryProvider } from '@/lib/context/daily-summary-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <EmailProvider>
        <DailySummaryProvider>
          {children}
        </DailySummaryProvider>
      </EmailProvider>
    </SessionProvider>
  );
}