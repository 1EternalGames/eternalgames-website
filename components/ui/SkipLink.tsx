// components/ui/SkipLink.tsx
import React from 'react';
import styles from './SkipLink.module.css';

export default function SkipLink() {
  return (
    <a href="#main-content" className={styles.skipLink}>
      تجاوز إلى المحتوى الرئيسي
    </a>
  );
}