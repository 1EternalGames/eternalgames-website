// app/studio/[contentType]/[id]/editor-components/QualityToggle.tsx
'use client';

import { UploadQuality } from '@/lib/image-optimizer';
import styles from '../BlockToolbar.module.css';
import bubbleStyles from '../Editor.module.css';
import editorStyles from '../Editor.module.css';

interface QualityToggleProps {
    currentQuality: UploadQuality;
    onQualityChange: (quality: UploadQuality) => void;
    isMobile?: boolean;
}

const qualityCycle: UploadQuality[] = ['1080p', '4k', '8k'];
const qualityLabels: Record<UploadQuality, string> = {
    '1080p': 'FHD',
    '4k': '4K',
    '8k': '8K'
};
const qualityTooltips: Record<UploadQuality, string> = {
    '1080p': 'Full HD (1080p)',
    '4k': 'Ultra HD (4K)',
    '8k': 'Full Ultra HD (8K)'
};

export function QualityToggle({ currentQuality, onQualityChange, isMobile = false }: QualityToggleProps) {
    
    const cycleQuality = () => {
        const currentIndex = qualityCycle.indexOf(currentQuality);
        const nextIndex = (currentIndex + 1) % qualityCycle.length;
        onQualityChange(qualityCycle[nextIndex]);
    };

    if (isMobile) {
        return (
             <button
                onClick={cycleQuality}
                className={editorStyles.iconButton}
                style={{ width: '36px', height: '36px' }}
                title={`جودة الرفع: ${qualityTooltips[currentQuality]}`}
            >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                    {qualityLabels[currentQuality]}
                </span>
            </button>
        );
    }

    return (
        <div className={styles.optionButtonWrapper}>
            <button
                onClick={cycleQuality}
                className={bubbleStyles.bubbleMenuButton}
                title={`Cycle upload quality`}
            >
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                    {qualityLabels[currentQuality]}
                </span>
            </button>
            <div className={styles.optionTooltip}>
                جودة الرفع: {qualityTooltips[currentQuality]}
            </div>
        </div>
    );
}


