// components/ArticleGrid.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ArticleCard from './ArticleCard';
import { CardProps } from '@/types';

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

export default function ArticleGrid({ articles }: { articles: CardProps[] }) {
  return (
    <motion.div layout className="content-grid">
      <AnimatePresence>
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            layout
            variants={kineticCardVariant}
            // initial, animate, exit are inherited from parent ContentBlock
            transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
            style={{ height: '100%' }}
          >
            <ArticleCard
              article={article}
              layoutIdPrefix="articles-grid"
              isPriority={index < 3}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}