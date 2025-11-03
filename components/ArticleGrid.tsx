// components/ArticleGrid.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ArticleCard from './ArticleCard';
import { CardProps } from '@/types';

export default function ArticleGrid({ articles }: { articles: CardProps[] }) {
  return (
    <motion.div layout className="content-grid">
      <AnimatePresence>
        {articles.map((article, index) => ( // <-- ADD INDEX
          <motion.div
            key={article.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring' as const, stiffness: 250, damping: 25 }}
            style={{ height: '100%' }}
          >
            <ArticleCard
              article={article}
              layoutIdPrefix="articles-grid"
              isPriority={index < 3} // <-- PASS PROP TO FIRST 3 CARDS
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}


