// components/FilteredReviewsGrid.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ArticleCard from './ArticleCard';
import type { CardProps } from '@/types'; 

const kineticCardVariant = {
    hidden: { 
        opacity: 0, 
        y: 60, 
        rotateX: -20,
        skewY: 5,
        clipPath: "inset(100% 0% 0% 0%)"
    },
    visible: { 
        opacity: 1, 
        y: 0, 
        rotateX: 0,
        skewY: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        transition: { 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1] as const,
            y: { type: 'spring', stiffness: 120, damping: 20 }
        }
    },
    exit: { 
        opacity: 0, 
        y: -30, 
        transition: { duration: 0.3 } 
    }
};

export default function FilteredReviewsGrid({ reviews }: { reviews: CardProps[] }) {
  return (
    <motion.div layout className="content-grid" style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}>
      <AnimatePresence>
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            layout
            variants={kineticCardVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
            style={{ height: '100%' }}
          >
            <ArticleCard
              article={review}
              layoutIdPrefix="reviews"
              isPriority={index < 3}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}