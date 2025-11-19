// components/upscaler/UpscalerProcessing.tsx
'use client';

import { motion } from 'framer-motion';
import styles from './Upscaler.module.css';
import { UpscaleStatus } from '@/hooks/useUpscaler';

interface ProcessingProps {
    status: UpscaleStatus;
    progress: number;
    message: string;
    imageSrc: string;
}

export default function UpscalerProcessing({ status, progress, message, imageSrc }: ProcessingProps) {
    return (
        <div className={styles.processingContainer}>
            <div className={styles.previewWrapper}>
                {/* Blurry Background Image */}
                <img src={imageSrc} alt="Processing" className={styles.processingImage} />
                
                {/* Scanning Beam */}
                <motion.div 
                    className={styles.scanBeam}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className={styles.statusOverlay}>
                    <div className="spinner" style={{ width: '50px', height: '50px', borderTopColor: 'var(--accent)' }} />
                    <p className={styles.statusMessage}>{message}</p>
                    
                    {status === 'downloading' && (
                        <div className={styles.progressBarContainer}>
                            <div className={styles.progressBarTrack}>
                                <motion.div 
                                    className={styles.progressBarFill} 
                                    style={{ width: `${progress}%` }} 
                                />
                            </div>
                            <span className={styles.progressText}>{Math.round(progress)}%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}