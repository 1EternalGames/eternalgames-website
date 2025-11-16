// components/content/GameDetails.tsx
'use client';

import React from 'react';
import styles from './GameDetails.module.css';

type Detail = {
  label: string;
  value: string;
};

interface GameDetailsProps {
  details: Detail[];
}

const isRTL = (s: string) => {
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlChars.test(s);
};

export default function GameDetails({ details }: GameDetailsProps) {
  if (!details || details.length === 0) {
    return null;
  }

  return (
    <div className={styles.detailsContainer}>
      {details.map((detail, index) => (
        <div key={index} className={styles.detailRow}>
          <span className={styles.detailLabel}>{detail.label}</span>
          <span
            className={styles.detailValue}
            dir={isRTL(detail.value) ? 'rtl' : 'ltr'}
          >
            {detail.value}
          </span>
        </div>
      ))}
    </div>
  );
}