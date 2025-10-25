// components/DigitalAtriumHomePage.tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import TriptychHero from './TriptychHero';
import { ContentBlock } from './ContentBlock';
import NewsTicker from './NewsTicker';
import VanguardReviews from './VanguardReviews/VanguardReviews';
import PaginatedCarousel from './PaginatedCarousel';
import { adaptToCardProps } from '@/lib/adapters';
import styles from './DigitalAtriumHomePage.module.css';

// This sub-component is perfect for the sections below the hero. No changes needed here.
const AnimatedContentBlock = ({ title, children, direction = 'right', variant = 'default' }: { title: string, children?: React.ReactNode, direction?: 'left' | 'right' | 'bottom', variant?: 'default' | 'fullbleed' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 }); 
    const variants = { 
        right: { hidden: { opacity: 0, x: 100 }, visible: { opacity: 1, x: 0 } },
        left: { hidden: { opacity: 0, x: -100 }, visible: { opacity: 1, x: 0 } },
        bottom: { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } } 
    };
    return ( 
        <motion.div ref={ref} variants={variants[direction]} initial="hidden" animate={isInView ? "visible" : "hidden"} transition={{ duration: 0.8, ease: "easeOut" }}> 
            <ContentBlock title={title} variant={variant}>{children}</ContentBlock> 
        </motion.div> 
    );
};

export default function DigitalAtriumHomePage({ heroContent, reviews, articles, latestNews, children }: {
    heroContent: any;
    reviews: any[];
    articles: any[];
    latestNews: any[];
    children: React.ReactNode;
}) {
  const adaptedReviews = (reviews || []).map(adaptToCardProps).filter(Boolean);
  const adaptedArticles = (articles || []).map(adaptToCardProps).filter(Boolean);
  const adaptedLatestNews = (latestNews || []).map(adaptToCardProps).filter(Boolean);
  
  return (
    <div className={styles.atriumPageContainer}>
      
      {/* --- THE FIX: Reduced minHeight to pull the hero section higher --- */}
      <motion.div 
        style={{ paddingTop: 'var(--nav-height-scrolled)', minHeight: '80vh', display: 'flex', alignItems: 'center' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      >
        <TriptychHero heroContent={heroContent} panelStyles={{}} />
      </motion.div>
      
      <div className={styles.atriumMainContent}>
          <AnimatedContentBlock title="مراجعات الطليعة" direction="bottom" variant="fullbleed">
              <VanguardReviews reviews={adaptedReviews} />
          </AnimatedContentBlock>
          
          <div className="container">
              <div className={styles.atriumGrid}>
                  <main className={styles.atriumMainColumn}>
                      <AnimatedContentBlock title="مقالات مختارة" direction="right"><PaginatedCarousel items={adaptedArticles} itemsPerPage={2} layoutIdPrefix="atrium-articles" /></AnimatedContentBlock>
                  </main>
                  <aside className="atrium-sidebar-column">
                      <motion.div initial={{ opacity: 0, x: -100 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} viewport={{ once: true, amount: 0.7 }}>
                          <NewsTicker latestNews={adaptedLatestNews} />
                      </motion.div>
                  </aside>
              </div>
              {children}
          </div>
      </div>
    </div>
  );
}