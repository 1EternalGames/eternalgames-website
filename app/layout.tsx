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
import Lightbox from '@/components/Lightbox'; // <-- IMPORT LIGHTBOX

const cairo = Cairo({
subsets: ['arabic', 'latin'],
display: 'swap',
variable: '--font-main',
weight: ['400', '500', '700', '800'],
});

export const metadata = { title: 'EternalGames | الألعاب أبدية', description: 'الألعاب أبدية.', };

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
<div style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
    <ToastProvider />
    <Lightbox /> 
    <Navbar />
    <main>{children}</main>
    <Footer />
    <StudioBar />
</div>
</ThemeProvider>
</NextAuthProvider>
</body>
</html>
);
}