// components/ArticleGrid.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ArticleCard from './ArticleCard';
import { CardProps } from '@/types';

const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
    exit: { 
        opacity: 0,
    }
  };

const kineticCardVariant = {
    hidden: { 
        opacity: 0, 
        y: 60, 
    },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1] as const,
        }
    },
    exit: { 
        opacity: 0, 
        transition: { duration: 0.3 } 
    }
};

export default function ArticleGrid({ articles }: { articles: CardProps[] }) {
  return (
    <motion.div 
        layout 
        className="content-grid"
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
    >
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            layout
            variants={kineticCardVariant}
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
    </motion.div>
  );
}