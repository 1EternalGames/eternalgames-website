// components/DigitalAtriumHomePage.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import TriptychHero from './TriptychHero';
import { ContentBlock } from './ContentBlock';
import NewsTicker from './NewsTicker';
import VanguardReviews from './VanguardReviews/VanguardReviews';
import PaginatedCarousel from './PaginatedCarousel';
import { adaptToCardProps } from '@/lib/adapters';
import styles from './DigitalAtriumHomePage.module.css';

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
  const [isMounted, setIsMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setIsMounted(true); }, []);
  
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '-25%']);
  const heroOpacity = useTransform(scrollYProgress, [0.8, 1.0], [1, 0]);

  const leftPanelX = useTransform(scrollYProgress, [0, 0.6], ['0%', '-50%']);
  const rightPanelX = useTransform(scrollYProgress, [0, 0.6], ['0%', '50%']);
  const centerPanelScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.8]);
  const panelsOpacity = useTransform(scrollYProgress, [0.3, 0.6], [1, 0]);

  const contentOpacity = useTransform(scrollYProgress, [0.6, 0.8], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.6, 0.8], ["100px", "0px"]);
  
  const panelStyles = {
      left: { x: leftPanelX, opacity: panelsOpacity },
      center: { scale: centerPanelScale, opacity: panelsOpacity },
      right: { x: rightPanelX, opacity: panelsOpacity }
  };

  const adaptedReviews = (reviews || []).map(adaptToCardProps).filter(Boolean);
  const adaptedArticles = (articles || []).map(adaptToCardProps).filter(Boolean);
  const adaptedLatestNews = (latestNews || []).map(adaptToCardProps).filter(Boolean);
  
  const contentStyle = { marginTop: '-10vh', ...(isMounted ? { opacity: contentOpacity, y: contentY } : { opacity: 0 }) };

  return (
    <div className={styles.atriumPageContainer}>
      <div ref={heroRef} style={{ height: '120vh' }}>
        <motion.div 
          className={styles.stickyHeroWrapper} 
          style={ isMounted ? { opacity: heroOpacity, y: heroY, position: 'sticky' } : { position: 'sticky' } }
        >
          <TriptychHero heroContent={heroContent} panelStyles={panelStyles} />
        </motion.div>
      </div>
      
      <motion.div className={styles.atriumMainContent} style={contentStyle}>
          {/* --- THE FIX IS HERE --- */}
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
      </motion.div>
    </div>
  );
}