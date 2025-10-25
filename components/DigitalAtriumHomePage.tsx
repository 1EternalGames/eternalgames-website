// components/DigitalAtriumHomePage.tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ContentBlock } from './ContentBlock';
import VanguardReviews from './VanguardReviews/VanguardReviews';
import HorizontalShowcase from './HorizontalShowcase';
import TerminalTicker from './TerminalTicker';
import { adaptToCardProps } from '@/lib/adapters';
import styles from './DigitalAtriumHomePage.module.css';

const AnimatedContentBlock = ({ title, children, direction = 'bottom' }: { title: string, children?: React.ReactNode, direction?: 'left' | 'right' | 'bottom' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 }); 
    const variants = { 
        right: { hidden: { opacity: 0, x: 100 }, visible: { opacity: 1, x: 0 } },
        left: { hidden: { opacity: 0, x: -100 }, visible: { opacity: 1, x: 0 } },
        bottom: { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } } 
    };
    return ( 
        <motion.div ref={ref} variants={variants[direction]} initial="hidden" animate={isInView ? "visible" : "hidden"} transition={{ duration: 0.8, ease: "easeOut" }}> 
            <ContentBlock title={title}>{children}</ContentBlock> 
        </motion.div> 
    );
};

export default function DigitalAtriumHomePage({ reviews, articles, latestNews, children }: {
    reviews: any[];
    articles: any[];
    latestNews: any[];
    children: React.ReactNode;
}) {
  const adaptedReviews = (reviews || []).map(adaptToCardProps).filter(Boolean);
  const adaptedArticles = (articles || []).map(adaptToCardProps).filter(Boolean);
  
  return (
    <div className={styles.atriumPageContainer}>
      <div className={styles.vanguardSection}>
        <ContentBlock title="ديوان الطليعة" variant="fullbleed">
          <VanguardReviews reviews={adaptedReviews} />
        </ContentBlock>
      </div>
      
      <div className={`container ${styles.atriumMainContent}`}>
          <div className={styles.atriumGrid}>
              <main className={styles.atriumMainColumn}>
                  <AnimatedContentBlock title="مقالات مختارة" direction="right">
                      <HorizontalShowcase articles={adaptedArticles} onActiveIndexChange={() => {}} />
                  </AnimatedContentBlock>
              </main>
              <aside className={styles.atriumSidebar}>
                  <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    viewport={{ once: true, amount: 0.7 }}
                  >
                    <TerminalTicker headlines={latestNews} />
                  </motion.div>
              </aside>
          </div>
          {children}
      </div>
    </div>
  );
}