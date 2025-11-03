// components/TerminalTicker.tsx
'use client';

import { useState, useEffect } from 'react';
import type { SanityNews } from '@/types/sanity';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../app/news/NewsPage.module.css'; // <-- IMPORTED

const ScrambledText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const chars = '!<>-_\\/[]{}—=+*^?#________';

  useEffect(() => {
    let frame = 0;
    const frameRate = 2;
    const scrambleDuration = 30;

    const intervalId = setInterval(() => {
      let newText = '';
      let isComplete = true;

      for (let i = 0; i < text.length; i++) {
        const progress = (frame - i * frameRate) / scrambleDuration;
        if (progress < 1 && progress > 0) {
          const randomChar = chars[Math.floor(Math.random() * chars.length)];
          newText += randomChar;
          isComplete = false;
        } else {
          newText += text[i];
        }
      }

      setDisplayText(newText);
      frame++;

      if (isComplete) {
        clearInterval(intervalId);
      }
    }, 40);

    return () => clearInterval(intervalId);
  }, [text]);

  return <>{displayText}</>;
};

export default function TerminalTicker({ headlines }: { headlines: SanityNews[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % headlines.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [headlines.length]);

  return (
    <div className={styles.terminalTickerContainer}>
      <h3 className={styles.terminalTickerTitle}>
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4d4d', marginRight: '1rem' }}
        />
        LIVE FEED
      </h3>
      <div className={styles.terminalTickerContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href={`/news/${headlines[index].slug}`} className="no-underline">
              <p className={styles.terminalTickerCategory}>{headlines[index].category}</p>
              <h4 className={styles.terminalTickerHeadline}>
                <ScrambledText text={headlines[index].title} />
              </h4>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}








