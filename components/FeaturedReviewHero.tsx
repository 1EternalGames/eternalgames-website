// components/FeaturedReviewHero.tsx

'use client';

import type { SanityReview } from '@/types/sanity';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';
import styles from './FeaturedReviewHero.module.css'; // <-- CORRECTED IMPORT

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export default function FeaturedReviewHero({ review }: { review: SanityReview }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springConfig = { damping: 25, stiffness: 200 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  const bgMouseX = useTransform(smoothMouseX, [0, 1], ["-2.5%", "2.5%"]);
  const bgMouseY = useTransform(smoothMouseY, [0, 1], ["-2.5%", "2.5%"]);
  const contentMouseX = useTransform(smoothMouseX, [0, 1], ["2%", "-2%"]);
  const contentMouseY = useTransform(smoothMouseY, [0, 1], ["2%", "-2%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width);
    mouseY.set((e.clientY - top) / height);
  };
  const handleMouseLeave = () => { mouseX.set(0.5); mouseY.set(0.5); };

  return (
    <div ref={containerRef} className={styles.featuredHeroContainer} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <motion.div className={styles.featuredHeroBg} style={{ y: parallaxY, x: bgMouseX, y: bgMouseY }}>
        <Image src={review.mainImage.url} alt={`Background for ${review.title}`} fill style={{ objectFit: 'cover' }} priority placeholder="blur" blurDataURL={review.mainImage.blurDataURL} />
      </motion.div>
      <div className={styles.featuredHeroOverlay} />
      
      <motion.div 
        className={`container ${styles.featuredHeroContent}`}
        style={{ x: contentMouseX, y: contentMouseY }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={itemVariants} className={styles.featuredHeroLabel}>الأعلى تقييمًا</motion.p>
        <motion.h1 variants={itemVariants} className={styles.featuredHeroTitle}>{review.title}</motion.h1>
        <motion.div variants={itemVariants} className={styles.featuredHeroMeta}>
          <span className={styles.featuredHeroScore}>{review.score?.toFixed(1)}</span>
          {/* THE FIX: Only render the game title if it exists */}
          {review.game?.title && (
            <span className={styles.featuredHeroGame}>{review.game.title}</span>
          )}
        </motion.div>
        <motion.div variants={itemVariants}>
          <Link href={`/reviews/${review.slug}`} className="primary-button no-underline" style={{padding: '1.2rem 3rem', fontSize: '1.8rem'}}>اقرأ المراجعة كاملة</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}


