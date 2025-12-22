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
import SpaceBackground from '@/components/ui/SpaceBackground';
import type { Metadata } from 'next';
import FPSAutoTuner from '@/components/FPSAutoTuner'; // IMPORT ADDED

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
    default: 'EternalGames | حيث لا تُفنى الألعاب',
    template: '%s | EternalGames',
  },
  description: 'منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار بتجربة تفاعلية فريدة.',
  alternates: {
    canonical: './',
  },
  openGraph: {
    title: {
      default: 'EternalGames | حيث لا تُفنى الألعاب',
      template: '%s | EternalGames',
    },
    description: 'منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار بتجربة تفاعلية فريدة.',
    url: siteUrl,
    siteName: 'EternalGames',
    images: [
      {
        url: `${siteUrl}/og.png`,
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
    title: {
      default: 'EternalGames | حيث لا تُفنى الألعاب',
      template: '%s | EternalGames',
    },
    description: 'منصة محتوى متخصصة في عالم الألعاب، تقدم مراجعات عميقة، مقالات تحليلية، وآخر الأخبار بتجربة تفاعلية فريدة.',
    images: [`${siteUrl}/og.png`],
  },
  // SEO: Verification for Google Search Console
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Replace this after getting it from Search Console
    yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// FIX: Removed async, getServerSession, and Prisma. This layout is now STATIC.
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
            {/* THE FIX: Added overflowX: 'clip' to constrain layout overflow */}
            <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'clip' }}>
              <FPSAutoTuner /> {/* MOUNTED AUTO TUNER */}
              <SpaceBackground />
              <ToastProvider />
              <Lightbox />
              <Navbar />
              {/* THE FIX: Added overflow: 'clip' here. This prevents negative margins in children from extending the scroll height past the footer. */}
              <main style={{ flexGrow: 1, position: 'relative', overflow: 'clip', display: 'block' }}>
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