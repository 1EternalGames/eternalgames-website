'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
// CORRECTED: The 'ThemeProviderProps' type is now imported directly from the main package.
// The old '/dist/types' path no longer exists in the newer version of the library.
import { type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}






























