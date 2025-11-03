// app/studio/[contentType]/[id]/metadata/PlatformInput.tsx
'use client';

import { motion } from 'framer-motion';
import styles from '../Editor.module.css';
import filterStyles from '@/components/filters/Filters.module.css';

const PLATFORMS = ['PC', 'PS5', 'Xbox', 'Switch'];

interface PlatformInputProps {
    selectedPlatforms: string[];
    onPlatformsChange: (platforms: string[]) => void;
}

export function PlatformInput({ selectedPlatforms = [], onPlatformsChange }: PlatformInputProps) {
    
    const handleToggle = (platform: string) => {
        const newSelection = selectedPlatforms.includes(platform)
            ? selectedPlatforms.filter(p => p !== platform)
            : [...selectedPlatforms, platform];
        onPlatformsChange(newSelection);
    };

    return (
        <div className={styles.sidebarSection}>
            <label className={styles.sidebarLabel}>المنصات</label>
            <div className={filterStyles.filterButtonsGroup}>
                {PLATFORMS.map(platform => {
                    const isActive = selectedPlatforms.includes(platform);
                    return (
                        <motion.button
                            key={platform}
                            type="button"
                            onClick={() => handleToggle(platform)}
                            className={`${filterStyles.filterButton} ${isActive ? filterStyles.active : ''}`}
                        >
                            {platform}
                            {isActive && <motion.div layoutId="platform-highlight" className={filterStyles.filterHighlight} />}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}





