// components/DigitalAtriumHomePage.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import TriptychHero from './TriptychHero';
import { ContentBlock } from './ContentBlock';
import NewsTicker from './NewsTicker';
import PaginatedCarousel from './PaginatedCarousel';
import { adaptToCardProps } from '@/lib/adapters';
import styles from './DigitalAtriumHomePage.module.css';

const AnimatedContentBlock = ({ title, children, direction = 'right' }: { title: string, children: React.ReactNode, direction?: 'left' | 'right' | 'bottom' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.4 }); 
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
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0.7, 0.9], [1, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.1, 0.3], ["50px", "0px"]);
  
  const adaptedReviews = (reviews || []).map(adaptToCardProps).filter(Boolean);
  const adaptedArticles = (articles || []).map(adaptToCardProps).filter(Boolean);
  // THE FIX: Adapt the news data before passing it to the ticker
  const adaptedLatestNews = (latestNews || []).map(adaptToCardProps).filter(Boolean);
  
  const contentStyle = { marginTop: '-20vh', ...(isMounted ? { opacity: contentOpacity, y: contentY } : { opacity: 0 }) };

  return (
    <div className={styles.atriumPageContainer}>
      <div ref={heroRef} style={{ height: '100vh' }}>
        <motion.div className={styles.stickyHeroWrapper} style={ isMounted ? { scale: heroScale, y: heroY, opacity: heroOpacity, position: 'sticky' } : { position: 'sticky' } }>
          <TriptychHero heroContent={heroContent} />
        </motion.div>
      </div>
      
      <motion.div className={styles.atriumMainContent} style={contentStyle}>
          <div className="container">
              <div className={styles.atriumGrid}>
                  <main className={styles.atriumMainColumn}>
                      <AnimatedContentBlock title="مراجعات مختارة" direction="right"><PaginatedCarousel items={adaptedReviews} itemsPerPage={2} layoutIdPrefix="atrium-reviews" /></AnimatedContentBlock>
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