// components/DigitalAtriumHomePage.tsx
'use client';

import { ContentBlock } from './ContentBlock';
import VanguardReviews from './VanguardReviews/VanguardReviews';
import { adaptToCardProps } from '@/lib/adapters';
import AnimatedGridBackground from './AnimatedGridBackground';
import styles from './DigitalAtriumHomePage.module.css';
import { CardProps } from '@/types';

export default function DigitalAtriumHomePage({ reviews, children }: {
    reviews: any[];
    children: React.ReactNode;
}) {
  const adaptedReviews = (reviews || []).map(adaptToCardProps).filter(Boolean) as CardProps[];
  
  return (
    <div className={styles.atriumPageContainer}>
      <AnimatedGridBackground />
      <div className={styles.vanguardSection}>
        <ContentBlock title="ديوان الطليعة" variant="fullbleed">
          <VanguardReviews reviews={adaptedReviews} />
        </ContentBlock>
      </div>
      
      <div className={`container ${styles.atriumMainContent}`}>
          {children}
      </div>
    </div>
  );
}