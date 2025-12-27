// components/DigitalAtriumHomePage.tsx
'use client';

import React, { Suspense, memo } from 'react';
import { ContentBlock } from './ContentBlock';
import VanguardReviews from './VanguardReviews/VanguardReviews';
import { adaptToCardProps } from '@/lib/adapters';
import { ReviewIcon, ReleaseIcon } from '@/components/icons/index';
import styles from './DigitalAtriumHomePage.module.css';
import { CardProps } from '@/types';

const DigitalAtriumHomePage = memo(function DigitalAtriumHomePage({
    reviews,
    feedsContent,
    releasesSection
}: {
    reviews: any[];
    feedsContent: React.ReactNode;
    releasesSection: React.ReactNode;
}) {
  // LIMIT: Slice to top 10 items for the Vanguard carousel
  const adaptedReviews = (reviews || [])
      .slice(0, 10)
      .map(item => adaptToCardProps(item, { width: 800 }))
      .filter(Boolean) as CardProps[];
  
  return (
    <div className={styles.atriumPageContainer}>
      <div className={styles.vanguardFullBleedContainer}>
        <div className="container">
            <ContentBlock title="أحدث المراجعات" Icon={ReviewIcon} />
        </div>
        <VanguardReviews reviews={adaptedReviews} />
      </div>
      
      <div className={styles.atriumMainContent}>
          <div className="container">
              {feedsContent}
          </div>
          
          <ContentBlock title="إصدارات هذا الشهر" Icon={ReleaseIcon} variant="fullbleed">
              <div className="container">
                  <p style={{textAlign: 'center', maxWidth: '600px', margin: '-2rem auto 4rem auto', color: 'var(--text-secondary)'}}>
                      نظرة على الألعاب التي ترى النور هذا الشهر. ما صدر منها قد وُسِمَ بعلامة.
                  </p>
                  <Suspense fallback={null}>
                      {releasesSection}
                  </Suspense>
              </div>
          </ContentBlock>
      </div>
    </div>
  );
});

export default DigitalAtriumHomePage;