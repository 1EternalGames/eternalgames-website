// app/studio/[contentType]/[id]/metadata/color-dictionary/ColorDictionaryManager.tsx
'use client'

import React, { useState } from 'react';
import { ColorWheelIcon } from '@sanity/icons';
import ColorDictionaryModal from './ColorDictionaryModal'; // Import the new modal
import styles from './ColorDictionaryManager.module.css';

type ColorMapping = {
  _key?: string;
  word: string;
  color: string;
};

interface ColorDictionaryManagerProps {
  initialMappings: ColorMapping[];
}

export default function ColorDictionaryManager({ initialMappings }: ColorDictionaryManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mappings, setMappings] = useState<ColorMapping[]>(initialMappings);

  const handleUpdateMappings = (newMappings: ColorMapping[]) => {
    setMappings(newMappings);
    // Here you could also trigger a re-render of the Tiptap editor if needed,
    // for example by updating its extensions config, though it's complex.
    // For now, updating the local state is sufficient.
  };

  return (
    <>
      <div className={styles.managerContainer}>
        <button className={styles.toggleHeader} onClick={() => setIsModalOpen(true)}>
          <div className={styles.headerTitle}>
            <ColorWheelIcon />
            <span>ألوان الكلمات التلقائية</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.4rem', color: 'var(--text-secondary)' }}>{mappings.length} words</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </button>
      </div>

      <ColorDictionaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMappings={mappings}
        onUpdate={handleUpdateMappings}
      />
    </>
  );
}


