// components/FilteredReviewsGrid.tsx

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ArticleCard from './ArticleCard';
import type { CardProps } from '@/types'; 

export default function FilteredReviewsGrid({ reviews }: { reviews: CardProps[] }) {
  return (
    <motion.div layout className="content-grid">
      <AnimatePresence>
        {reviews.map((review, index) => ( // <-- ADD INDEX
          <motion.div
            key={review.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring' as const, stiffness: 250, damping: 25 }}
            style={{ height: '100%' }}
          >
            <ArticleCard
              article={review}
              layoutIdPrefix="reviews"
              isPriority={index < 3} // <-- PASS PROP TO FIRST 3 CARDS
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}


