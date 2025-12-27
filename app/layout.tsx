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
import FPSAutoTuner from '@/components/FPSAutoTuner'; 
import KonamiCode from '@/components/effects/KonamiCode';
import GoogleAnalytics from '@/components/seo/GoogleAnalytics';
import SmoothScrolling from '@/components/ui/SmoothScrolling';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import SkipLink from '@/components/ui/SkipLink'; 
import CookieConsent from '@/components/CookieConsent';
import KineticOverlayManager from '@/components/kinetic/KineticOverlayManager'; 
import { getCachedColorDictionary } from '@/lib/sanity.fetch';
import { getAllStaffAction, getAllTagsAction } from '@/app/actions/homepageActions'; // IMPORT

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
    types: {
      'application/rss+xml': [
          { url: '/feed.xml', title: 'EternalGames Main Feed' },
          { url: '/feed/reviews', title: 'EternalGames Reviews' },
          { url: '/feed/news', title: 'EternalGames News' },
          { url: '/feed/articles', title: 'EternalGames Articles' },
      ],
    },
  },
  other: {
      'application/opensearchdescription+xml': '/opensearch.xml',
  },
  authors: [
      { name: 'EternalGames Team', url: siteUrl },
      { name: 'MoVisionX', url: '/humans.txt' }
  ],
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
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', 
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

export default async function RootLayout({ children }: { children: React.ReactNode; }) {
  // Fetch color dictionary, creators AND tags on the server layout
  const [dictionary, creators, tags] = await Promise.all([
      getCachedColorDictionary(),
      getAllStaffAction(),
      getAllTagsAction()
  ]);
  
  const colors = dictionary?.autoColors || [];

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
          {/* Pass fetched creators AND tags to hydration */}
          <UserStoreHydration initialCreators={creators} initialTags={tags} />
          
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
          <OrganizationJsonLd />
          
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SmoothScrolling>
              <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'clip' }}>
                <SkipLink /> 
                <FPSAutoTuner /> 
                <KonamiCode />
                <SpaceBackground />
                <ToastProvider />
                <CookieConsent />
                <Lightbox />
                
                <KineticOverlayManager colorDictionary={colors} />

                <Navbar />
                <main id="main-content" style={{ flexGrow: 1, position: 'relative', overflow: 'clip', display: 'block' }}>
                  <PageTransitionWrapper>
                    {children}
                  </PageTransitionWrapper>
                </main>
                <Footer />
                <StudioBar />
                <ScrollToTopButton />
              </div>
            </SmoothScrolling>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}