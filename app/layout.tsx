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
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import type { Metadata } from 'next';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-main',
  weight: ['400', '500', '700', '800'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eternalgames.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EternalGames | حيث لا تفنى الألعاب',
    template: '%s | EternalGames',
  },
  description: 'منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار بتجربة تفاعلية فريدة.',
  openGraph: {
    title: 'EternalGames | حيث لا تفنى الألعاب',
    description: 'منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار بتجربة تفاعلية فريدة.',
    url: siteUrl,
    siteName: 'EternalGames',
    images: [
      {
        url: '/og.png', // Corrected path
        width: 1200,
        height: 630,
        alt: 'EternalGames Logo',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EternalGames | حيث لا تفنى الألعاب',
    description: 'منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار بتجربة تفاعلية فريدة.',
    images: [`${siteUrl}/og.png`], // Corrected path to be absolute for Twitter
  },
};

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