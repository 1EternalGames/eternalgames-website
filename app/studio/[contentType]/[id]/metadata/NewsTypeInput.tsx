// app/studio/[contentType]/[id]/metadata/NewsTypeInput.tsx
'use client';

import { motion } from 'framer-motion';
import styles from '../Editor.module.css';

type NewsType = 'official' | 'rumor' | 'leak';

interface NewsTypeInputProps {
    value: NewsType;
    onChange: (type: NewsType) => void;
}

const options: { label: string; value: NewsType; color: string }[] = [
    { label: 'رسمي', value: 'official', color: 'var(--accent)' },
    { label: 'إشاعة', value: 'rumor', color: '#F59E0B' }, // Amber
    { label: 'تسريب', value: 'leak', color: '#DC2626' }   // Red
];

export function NewsTypeInput({ value, onChange }: NewsTypeInputProps) {
    return (
        <div className={styles.sidebarSection}>
            <label className={styles.sidebarLabel}>تصنيف الخبر</label>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: '0.5rem', 
                background: 'var(--bg-primary)', 
                padding: '0.5rem', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
            }}>
                {options.map((option) => {
                    const isActive = value === option.value;
                    return (
                        <motion.button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={styles.sidebarInput} // Reuse base input styles for font/reset
                            style={{
                                height: '36px',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: isActive ? option.color : 'transparent',
                                color: isActive ? '#fff' : 'var(--text-secondary)',
                                borderColor: isActive ? option.color : 'transparent',
                                fontWeight: isActive ? 700 : 500,
                                fontSize: '1.3rem',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? `0 0 10px ${option.color}40` : 'none'
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {option.label}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}