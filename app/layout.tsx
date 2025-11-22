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
import { unstable_cache } from 'next/cache';

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

// OPTIMIZATION: Cache the role lookup.
// This removes the DB blocking on every page navigation for logged-in users.
const getCachedUserRoles = unstable_cache(
  async (userId: string) => {
    const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { roles: { select: { name: true } } }
    });
    return user?.roles.map((r: any) => r.name) || [];
  },
  ['user-roles-layout'], // Key
  { tags: ['user-roles'] } // Revalidation tag
);

export default async function RootLayout({ children }: { children: React.ReactNode; }) {
  const session = await getServerSession(authOptions);
  
  let userRoles: string[] = [];
  if (session?.user?.id) {
      // Use the cached function instead of direct Prisma call
      userRoles = await getCachedUserRoles(session.user.id);
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
        <NextAuthProvider session={session}>
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
              <StudioBar serverRoles={userRoles} />
              <ScrollToTopButton />
            </div>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}