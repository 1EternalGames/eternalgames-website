// components/HorizontalShowcase.tsx

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { CardProps } from '@/types';
import styles from './HorizontalShowcase.module.css';
import { sanityLoader } from '@/lib/sanity.loader';
import { useLivingCard } from '@/hooks/useLivingCard';
import { PenEdit02Icon, Calendar03Icon } from '@/components/icons';
import { translateTag } from '@/lib/translations';

const ArrowIcon = ({ direction = 'right' }: { direction?: 'left' | 'right' }) => (
  <svg width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={direction === 'right' ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
  </svg>
);

const satelliteConfig = [
    { hoverX: -120, hoverY: -40, rotate: -8 },
    { hoverX: 110, hoverY: -20, rotate: 10 }, 
    { hoverX: -10, hoverY: -130, rotate: 4 } 
];

const ShowcaseCard = ({ article, isActive }: { article: CardProps, isActive: boolean }) => {
  const router = useRouter();
  const setPrefix = useLayoutIdStore((state) => state.setPrefix);
  const layoutIdPrefix = "articles-showcase";
  const { livingCardRef, livingCardAnimation } = useLivingCard<HTMLDivElement>();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((e.target as HTMLElement).closest('a[href^="/tags/"]')) return;
    if ((e.target as HTMLElement).closest('a[href^="/creators/"]')) return; // Check for creator link too
    setPrefix(layoutIdPrefix);
    router.push(`/articles/${article.slug}`, { scroll: false });
  };

  const imageSource = article.imageUrl;
  if (!imageSource) return null;
  
  const displayTags = article.tags.slice(0, 3);
  
  // Get author details
  const author = article.authors?.[0];
  const authorName = author?.name;
  const authorUsername = author?.username;

  return (
    <motion.div
       className={styles.showcaseCardWrapper}
       animate={{ 
         scale: isActive ? 1 : 0.9, 
         opacity: isActive ? 1 : (isHovered ? 1 : 0.4),
         filter: isActive ? 'grayscale(0%)' : (isHovered ? 'grayscale(0%)' : 'grayscale(100%) brightness(0.6)')
       }}
       transition={{ type: 'spring', stiffness: 300, damping: 30 }}
       style={{ zIndex: isActive || isHovered ? 100 : 1 }}
    >
      <motion.div
        className={styles.livingCardContainer}
        ref={livingCardRef}
        onMouseMove={livingCardAnimation.onMouseMove}
        onMouseEnter={() => { livingCardAnimation.onMouseEnter(); setIsHovered(true); }}
        onMouseLeave={() => { livingCardAnimation.onMouseLeave(); setIsHovered(false); }}
        onTouchStart={livingCardAnimation.onTouchStart}
        onTouchEnd={livingCardAnimation.onTouchEnd}
        style={{ ...livingCardAnimation.style, perspective: '1000px' }}
      >
        <Link 
            href={`/articles/${article.slug}`} 
            onClick={handleClick}
            className={`no-underline ${styles.showcaseCardLink}`}
            draggable="false"
        >
            <div className={styles.monolithFrame}>
                <motion.div 
                    className={styles.holoSpotlight} 
                    style={{ opacity: isHovered ? 1 : 0 }} 
                />
                
                <motion.div layoutId={`${layoutIdPrefix}-card-image-${article.legacyId}`} className={styles.showcaseCardImageWrapper}>
                  <Image 
                    loader={sanityLoader} 
                    src={imageSource} alt={article.title} fill sizes="60vw"
                    style={{ objectFit: 'cover' }} className={styles.showcaseCardImage}
                    draggable="false"
                    priority={isActive}
                  />
                </motion.div>

                <div className={styles.showcaseCardContent}>
                  <motion.h3 layoutId={`${layoutIdPrefix}-card-title-${article.legacyId}`} className={styles.showcaseCardTitle}>{article.title}</motion.h3>
                  <p className={styles.showcaseCardGame}>{article.game}</p>
                </div>
                
                {/* HUD / Meta */}
                <div className={styles.hudContainer} style={{ transform: 'translateZ(40px)' }}>
                    {authorName ? (
                        authorUsername ? (
                            <Link 
                                href={`/creators/${authorUsername}`}
                                onClick={(e) => e.stopPropagation()} 
                                className={`${styles.creditCapsule} no-underline`}
                                // FLIP CREDITS: Row Reverse for Icon on Right (since wrapper is LTR)
                                style={{ flexDirection: 'row-reverse' }} 
                                prefetch={false}
                            >
                                <div className={styles.capsuleIcon}>
                                    <PenEdit02Icon style={{ width: 14, height: 14 }} />
                                </div>
                                <span title={authorName}>{authorName}</span>
                            </Link>
                        ) : (
                            <div className={styles.creditCapsule} style={{ flexDirection: 'row-reverse' }}>
                                <div className={styles.capsuleIcon}>
                                    <PenEdit02Icon style={{ width: 14, height: 14 }} />
                                </div>
                                <span title={authorName}>{authorName}</span>
                            </div>
                        )
                    ) : <div />}

                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem'}}>
                        {article.date && (
                            <div className={styles.dateReadout}>
                                <Calendar03Icon style={{ width: '14px', height: '14px', color: 'var(--accent)' }} />
                                {article.date.split(' - ')[0]}
                            </div>
                        )}
                        <div className={styles.techDecoration}>
                            <div className={styles.techDot} />
                            <div className={styles.techDot} />
                            <div className={styles.techDot} />
                        </div>
                     </div>
                </div>
            </div>
            
            {/* Flying Satellites */}
            <div className={styles.satelliteField} style={{ transform: 'translateZ(60px)' }}>
                <AnimatePresence>
                    {isHovered && displayTags.map((tag, i) => (
                         <motion.div
                            key={`${article.id}-${tag.slug}`}
                            className={styles.satelliteShard}
                            initial={{ opacity: 0, scale: 0.4, x: 0, y: 50, z: 0 }}
                            animate={{
                                opacity: 1,
                                scale: 1.1,
                                x: satelliteConfig[i]?.hoverX || 0,
                                y: satelliteConfig[i]?.hoverY || 0,
                                rotate: satelliteConfig[i]?.rotate || 0,
                                z: -30 
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 180,
                                damping: 20,
                                delay: i * 0.05
                            }}
                            style={{ position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d' }}
                            onClick={(e) => e.stopPropagation()}
                         >
                             <Link 
                                href={`/tags/${tag.slug}`} 
                                onClick={(e) => e.stopPropagation()}
                                className={`${styles.satelliteShardLink} no-underline`}
                                prefetch={false}
                            >
                                 {translateTag(tag.title)}
                             </Link>
                         </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </Link>
      </motion.div>
    </motion.div>
  );
};

export default function HorizontalShowcase({ articles, onActiveIndexChange }: { articles: CardProps[], onActiveIndexChange: (index: number) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [xOffset, setXOffset] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const calculateAndGoToIndex = useCallback((index: number) => {
    if (!wrapperRef.current || !cardRefs.current[index]) return;
    const wrapperWidth = wrapperRef.current.offsetWidth;
    const targetCard = cardRefs.current[index]!;
    const targetOffsetLeft = targetCard.offsetLeft;
    const targetWidth = targetCard.offsetWidth;
    const newXOffset = (wrapperWidth / 2) - targetOffsetLeft - (targetWidth / 2);
    setXOffset(newXOffset);
    setActiveIndex(index);
    onActiveIndexChange(index);
    setIsCalculated(true);
  }, [onActiveIndexChange]);

  useEffect(() => {
    const handleResize = () => calculateAndGoToIndex(activeIndex);
    window.addEventListener('resize', handleResize);
    const timeoutId = setTimeout(() => handleResize(), 100); 
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timeoutId); };
  }, [activeIndex, calculateAndGoToIndex]);
  
  const handleNext = useCallback(() => { const nextIndex = Math.min(activeIndex + 1, articles.length - 1); calculateAndGoToIndex(nextIndex); }, [activeIndex, articles.length, calculateAndGoToIndex]);
  const handlePrev = useCallback(() => { const prevIndex = Math.max(activeIndex - 1, 0); calculateAndGoToIndex(prevIndex); }, [activeIndex, calculateAndGoToIndex]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'ArrowRight') handleNext(); if (event.key === 'ArrowLeft') handlePrev(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const onDragEnd = (event: any, { offset, velocity }: any) => {
    const swipeConfidenceThreshold = 10000;
    const swipePower = Math.abs(offset.x) * velocity.x;
    if (swipePower < -swipeConfidenceThreshold) { handleNext(); } 
    else if (swipePower > swipeConfidenceThreshold) { handlePrev(); } 
    else { calculateAndGoToIndex(activeIndex); }
  };

  return (
    <div ref={wrapperRef} className={styles.horizontalShowcaseWrapper} dir="ltr">
      <AnimatePresence>
        {isCalculated && activeIndex > 0 && (
          <motion.button 
              className={`${styles.showcaseArrow} ${styles.left}`} 
              onClick={handlePrev} 
              initial={{ opacity: 0, translateY: "-50%" }}
              animate={{ opacity: 1, translateY: "-50%" }} 
              exit={{ opacity: 0, translateY: "-50%" }} 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
            >
            <ArrowIcon direction="left" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCalculated && activeIndex < articles.length - 1 && (
          <motion.button 
              className={`${styles.showcaseArrow} ${styles.right}`} 
              onClick={handleNext} 
              initial={{ opacity: 0, translateY: "-50%" }}
              animate={{ opacity: 1, translateY: "-50%" }} 
              exit={{ opacity: 0, translateY: "-50%" }} 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
            >
            <ArrowIcon direction="right" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        className={styles.horizontalShowcaseList}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.1} onDragEnd={onDragEnd}
        initial={{ opacity: 0 }}
        animate={{ x: xOffset, opacity: isCalculated ? 1 : 0 }}
        transition={{ x: { type: 'spring', stiffness: 300, damping: 50 }, opacity: { duration: 0.5 } }}
      >
        {articles.map((article, index) => (
          <div key={article.id} ref={(el) => { cardRefs.current[index] = el; }} className={styles.showcaseItemWrapper}>
            <ShowcaseCard article={article} isActive={activeIndex === index} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}