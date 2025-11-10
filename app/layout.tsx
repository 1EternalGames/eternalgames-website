// app/layout.tsx
import { Cairo } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import NextAuthProvider from '@/components/SessionProvider';
import StudioBar from '@/components/StudioBar';
import ToastProvider from '@/components/ToastProvider';
import UserStoreHydration from '@/components/UserStoreHydration';
import Lightbox from '@/components/Lightbox';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';

const cairo = Cairo({
subsets: ['arabic', 'latin'],
display: 'swap',
variable: '--font-main',
weight: ['400', '500', '700', '800'],
});

export const metadata = { title: 'EternalGames | حيث لا تفنى الألعاب', description: 'لا fناء للألعاب.', };

export default function RootLayout({ children }: { children: React.ReactNode; }) {
return (
<html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
<head>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossOrigin="anonymous"
/>
<link
    rel="preconnect"
    href="https://cdn.sanity.io"
    crossOrigin="anonymous"
/>
</head>
<body>
<NextAuthProvider>
<UserStoreHydration />
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
<div style={{ position: 'relative', width: '100%', overflowX: 'clip' }}>
    <ToastProvider />
    <Lightbox /> 
    <Navbar />
    {/* MODIFIED: The redundant PageTransitionWrapper has been removed. */}
    {/* app/template.tsx is now the single source of truth for page transitions. */}
    <main>
        {children}
    </main>
    <Footer />
    <StudioBar />
    <ScrollToTopButton />
</div>
</ThemeProvider>
</NextAuthProvider>
</body>
</html>
);
}