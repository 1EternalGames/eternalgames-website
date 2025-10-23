// components/HorizontalShowcase.tsx

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import styles from './HorizontalShowcase.module.css';

const ArrowIcon = ({ direction = 'right' }: { direction?: 'left' | 'right' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={direction === 'right' ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
  </svg>
);

const ShowcaseCard = ({ article, isActive }: { article: any, isActive: boolean }) => {
  
  // --- THE DEFINITIVE FIX: ---
  // The source URL from the adapter might already have query params. We must strip them
  // before appending our own desired params to avoid conflicts and errors.
  const imageSource = article.imageUrl;
  if (!imageSource) return null;

  const baseUrl = imageSource.split('?')[0];
  const imageUrl = `${baseUrl}?w=1200&auto=format&q=80`;

  return (
    <motion.div
      className={styles.showcaseCardContainer}
      animate={{ 
        scale: isActive ? 1 : 0.85, 
        opacity: isActive ? 1 : 0.7,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Link href={`/articles/${article.slug}`} className={`no-underline ${styles.showcaseCardLink}`} tabIndex={isActive ? 0 : -1} draggable="false">
        <div className={styles.showcaseCardImageWrapper}>
          <Image 
            src={imageUrl} 
            alt={article.title} 
            fill 
            sizes="60vw"
            style={{ objectFit: 'cover' }}
            className={styles.showcaseCardImage}
            draggable="false"
            unoptimized
          />
        </div>
        <div className={styles.showcaseCardContent}>
          <h3 className={styles.showcaseCardTitle}>{article.title}</h3>
          <p className={styles.showcaseCardGame}>{article.game}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default function HorizontalShowcase({ articles, onActiveIndexChange }: { articles: any[], onActiveIndexChange: (index: number) => void }) {
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

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => calculateAndGoToIndex(activeIndex);
    window.addEventListener('resize', handleResize);
    // Initial calculation after a short delay to ensure layout is stable
    const timeoutId = setTimeout(() => handleResize(), 100); 
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [activeIndex, calculateAndGoToIndex]);
  
  const handleNext = useCallback(() => {
    const nextIndex = Math.min(activeIndex + 1, articles.length - 1);
    calculateAndGoToIndex(nextIndex);
  }, [activeIndex, articles.length, calculateAndGoToIndex]);

  const handlePrev = useCallback(() => {
    const prevIndex = Math.max(activeIndex - 1, 0);
    calculateAndGoToIndex(prevIndex);
  }, [activeIndex, calculateAndGoToIndex]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') handleNext();
      if (event.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const onDragEnd = (event: any, { offset, velocity }: any) => {
    const swipeConfidenceThreshold = 10000;
    const swipePower = Math.abs(offset.x) * velocity.x;

    if (swipePower < -swipeConfidenceThreshold) {
      handleNext();
    } else if (swipePower > swipeConfidenceThreshold) {
      handlePrev();
    } else {
      // Snap back to the current active index if not a strong swipe
      calculateAndGoToIndex(activeIndex);
    }
  };

  return (
    <div ref={wrapperRef} className={styles.horizontalShowcaseWrapper} dir="ltr">
      <AnimatePresence>
        {isCalculated && activeIndex > 0 && (
          <motion.button className={`${styles.showcaseArrow} ${styles.left}`} onClick={handlePrev} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ArrowIcon direction="left" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCalculated && activeIndex < articles.length - 1 && (
          <motion.button className={`${styles.showcaseArrow} ${styles.right}`} onClick={handleNext} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ArrowIcon direction="right" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        className={styles.horizontalShowcaseList}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
        initial={{ opacity: 0 }}
        animate={{ 
          x: xOffset,
          opacity: isCalculated ? 1 : 0
        }}
        transition={{ 
          x: { type: 'spring', stiffness: 300, damping: 50 },
          opacity: { duration: 0.5 }
        }}
      >
        {articles.map((article, index) => (
          <div 
            key={article.id} 
            ref={el => cardRefs.current[index] = el}
            className={styles.showcaseItemWrapper}
          >
            <ShowcaseCard
              article={{...article, isLeft: index < activeIndex}}
              isActive={activeIndex === index}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}