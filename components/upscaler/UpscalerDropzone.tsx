// components/upscaler/UpscalerDropzone.tsx
'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Upscaler.module.css';

const ScanIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 16v3" />
        <path d="M12 5v3" />
        <path d="M16 12h3" />
        <path d="M5 12h3" />
    </svg>
);

export default function UpscalerDropzone({ onImageSelect }: { onImageSelect: (file: File) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent, active: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(active);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageSelect(e.dataTransfer.files[0]);
        }
    };

    return (
        <motion.div
            className={`${styles.dropzone} ${isDragging ? styles.active : ''}`}
            onDragEnter={(e) => handleDrag(e, true)}
            onDragOver={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <input 
                ref={inputRef} 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => e.target.files && onImageSelect(e.target.files[0])}
            />
            <div className={styles.dropzoneContent}>
                <motion.div 
                    animate={{ rotate: isDragging ? 180 : 0, scale: isDragging ? 1.2 : 1 }} 
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    style={{ color: 'var(--accent)', marginBottom: '1rem' }}
                >
                    <ScanIcon />
                </motion.div>
                <h3>المسبك البصري (Optical Foundry)</h3>
                <p>أفلت الصورة هنا لرفع دقتها x2 باستخدام الذكاء الاصطناعي.</p>
                <div className={styles.specsLabel}>
                    AI Model: Swin2SR Real-World Super Resolution
                </div>
            </div>
        </motion.div>
    );
}