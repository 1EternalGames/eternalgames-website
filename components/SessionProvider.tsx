// components/SessionProvider.tsx
'use client';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import React from 'react';

type Props = {
  children: React.ReactNode;
  session?: Session | null;
};

export default function NextAuthProvider({ children, session }: Props) {
  // THE FIX: Disable automatic refetching on window focus to reduce API calls.
  return (
    <SessionProvider 
      session={session as any} 
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}