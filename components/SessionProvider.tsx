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
  // THE FIX: Cast session to any to definitively resolve the TS2322 error
  // caused by module augmentation mismatches.
  return <SessionProvider session={session as any}>{children}</SessionProvider>;
}