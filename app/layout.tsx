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
import PageTransitionWrapper from '@/components/PageTransitionWrapper'; // MODIFIED: Import the new wrapper

const cairo = Cairo({
subsets: ['arabic', 'latin'],
display: 'swap',
variable: '--font-main',
weight: ['400', '500', '700', '800'],
});

export const metadata = { title: 'EternalGames | حيث لا تفنى الألعاب', description: 'لا فناء للألعاب.', };

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
<link
    rel="preload"
    href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap"
    as="style"
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
    {/* MODIFIED: Wrap main content with the new controlled transition wrapper */}
    <main>
        <PageTransitionWrapper>
            {children}
        </PageTransitionWrapper>
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