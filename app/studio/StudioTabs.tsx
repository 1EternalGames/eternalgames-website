// app/studio/StudioTabs.tsx
'use client';

import { motion } from 'framer-motion';
import styles from './StudioTabs.module.css';

export type ContentType = 'review' | 'article' | 'news' | 'gameRelease' | 'all';

interface StudioTabsProps {
    tabs: { label: string; value: ContentType }[];
    activeTab: ContentType;
    setActiveTab: (tab: ContentType) => void;
}

export function StudioTabs({ tabs, activeTab, setActiveTab }: StudioTabsProps) {
    const allTabs = [{ label: 'كل المحتوى', value: 'all' as ContentType }, ...tabs];

    return (
        <div className={styles.studioTabsContainer}>
            {allTabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`${styles.studioTabButton} ${activeTab === tab.value ? styles.active : ''}`}
                >
                    {tab.label}
                    {activeTab === tab.value && (
                        <motion.div className={styles.studioTabUnderline} layoutId="studioTabUnderline" />
                    )}
                </button>
            ))}
        </div>
    );
}





