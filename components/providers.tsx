'use client';

import { ReactNode } from 'react';
import { SessionProvider } from '@/lib/auth/session';
import { EmailProvider } from '@/lib/context/email-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <EmailProvider>
        {children}
      </EmailProvider>
    </SessionProvider>
  );
}