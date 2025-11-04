// components/DigitalAtriumHomePage.tsx
'use client';

import { Suspense } from 'react';
import { ContentBlock } from './ContentBlock';
import VanguardReviews from './VanguardReviews/VanguardReviews';
import { adaptToCardProps } from '@/lib/adapters';
import AnimatedGridBackground from './AnimatedGridBackground';
import { ReviewIcon, ReleaseIcon } from '@/components/icons/index';
import styles from './DigitalAtriumHomePage.module.css';
import { CardProps } from '@/types';
import FeedSkeleton from '@/components/homepage/feed/FeedSkeleton';

export default function DigitalAtriumHomePage({
    reviews,
    feedsContent,
    releasesSection
}: {
    reviews: any[];
    feedsContent: React.ReactNode;
    releasesSection: React.ReactNode;
}) {
  const adaptedReviews = (reviews || []).map(adaptToCardProps).filter(Boolean) as CardProps[];
  
  return (
    <div className={styles.atriumPageContainer}>
      <AnimatedGridBackground />
      <div className={styles.vanguardFullBleedContainer}>
        <div className="container">
            <ContentBlock title="ديوان الطليعة" Icon={ReviewIcon} />
        </div>
        <VanguardReviews reviews={adaptedReviews} />
      </div>
      
      <div className={styles.atriumMainContent}>
          <div className="container">
              <Suspense fallback={<FeedSkeleton />}>
                  {feedsContent}
              </Suspense>
          </div>
          
          <ContentBlock title="إصدارات هذا الشهر" Icon={ReleaseIcon} variant="fullbleed">
              <div className="container">
                  <p style={{textAlign: 'center', maxWidth: '600px', margin: '-2rem auto 4rem auto', color: 'var(--text-secondary)'}}>
                      نظرة على الألعاب التي ترى النور هذا الشهر. ما صدر منها قد وُسِمَ بعلامة.
                  </p>
                  <Suspense fallback={<div className="spinner" style={{margin: '12rem auto'}} />}>
                      {releasesSection}
                  </Suspense>
              </div>
          </ContentBlock>
      </div>
    </div>
  );
}