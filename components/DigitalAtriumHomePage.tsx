// components/DigitalAtriumHomePage.tsx
'use client';

import { ContentBlock } from './ContentBlock';
import VanguardReviews from './VanguardReviews/VanguardReviews';
import { adaptToCardProps } from '@/lib/adapters';
import AnimatedGridBackground from './AnimatedGridBackground';
import { ReviewIcon } from '@/components/icons/index';
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
      <div className={styles.vanguardFullBleedContainer}>
        <div className="container">
            <ContentBlock title="ديوان الطليعة" Icon={ReviewIcon} />
        </div>
        <VanguardReviews reviews={adaptedReviews} />
      </div>
      
      <div className={styles.atriumMainContent}>
          {children}
      </div>
    </div>
  );
}


