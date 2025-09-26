'use client';

import { SessionProvider } from '@/lib/auth/session';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}