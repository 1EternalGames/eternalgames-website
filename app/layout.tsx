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
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import prisma from '@/lib/prisma';
import BanEnforcer from '@/components/security/BanEnforcer';

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
};

export default async function RootLayout({ children }: { children: React.ReactNode; }) {
  const session = await getServerSession(authOptions);
  let userRoles: string[] = [];
  let isBanned = false;
  let banReason = null;

  if (session?.user?.id) {
      try {
          // Resilience: Wrap DB call to prevent app crash on connection failure
          const user = await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { 
                  roles: { select: { name: true } },
                  isBanned: true,
                  banReason: true
              }
          });
          userRoles = user?.roles.map(r => r.name) || [];
          isBanned = user?.isBanned || false;
          banReason = user?.banReason || null;
      } catch (error) {
          console.error("Failed to fetch user details for layout (DB unreachable):", error);
          // Fallback to session data if DB is down
          userRoles = (session.user as any).roles || [];
          isBanned = false; // Assume innocent if DB is down
      }
  }

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
          {/* Mount Ban Enforcer */}
          <BanEnforcer isBanned={isBanned} reason={banReason} />
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
              <StudioBar serverRoles={userRoles} />
              <ScrollToTopButton />
            </div>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}