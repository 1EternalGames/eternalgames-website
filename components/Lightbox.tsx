// components/Lightbox.tsx
'use client';

import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { useLightboxStore } from '@/lib/lightboxStore';
import { useBodyClass } from '@/hooks/useBodyClass'; // <-- IMPORT HOOK
import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './Lightbox.module.css';

const ZoomInIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ZoomOutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ResetIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ArrowIcon = ({ dir }: { dir: 'left' | 'right' }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points={dir === 'left' ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} /></svg>;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const springConfig = { type: 'spring', damping: 30, stiffness: 400 };

export default function Lightbox() {
    const { isOpen, imageUrls, currentIndex, closeLightbox, goToNext, goToPrevious } = useLightboxStore();
    const [isMounted, setIsMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const imageUrl = imageUrls[currentIndex];

    useBodyClass('lightbox-active', isOpen); // <-- REFACTORED

    const scale = useMotionValue(1);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const animatedScale = useSpring(scale, springConfig);
    const animatedX = useSpring(x, springConfig);
    const animatedY = useSpring(y, springConfig);
    
    const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

    useEffect(() => {
        setIsMounted(true);
        const handleKeyDown = (e: KeyboardEvent) => { 
            if (e.key === 'Escape') closeLightbox();
            if (isOpen && imageUrls.length > 1) {
                if (e.key === 'ArrowRight') goToPrevious();
                if (e.key === 'ArrowLeft') goToNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeLightbox, isOpen, imageUrls, goToNext, goToPrevious]);

    const resetTransform = useCallback(() => {
        scale.set(1);
        x.set(0);
        y.set(0);
    }, [scale, x, y]);

    useEffect(() => { if (isOpen) resetTransform(); }, [isOpen, resetTransform, currentIndex]);
    
    const updateConstraints = useCallback((currentScale: number) => {
        const currentX = x.get();
        const currentY = y.get();

        if (currentScale <= 1) {
            setDragConstraints({ left: 0, right: 0, top: 0, bottom: 0 });
            resetTransform();
            return;
        }

        if (containerRef.current && imageRef.current && imageRef.current.naturalWidth > 0) {
            const container = containerRef.current.getBoundingClientRect();
            const imageAspectRatio = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
            const containerAspectRatio = container.width / container.height;
            
            let renderedWidth, renderedHeight;
            if (imageAspectRatio > containerAspectRatio) {
                renderedWidth = container.width;
                renderedHeight = container.width / imageAspectRatio;
            } else {
                renderedHeight = container.height;
                renderedWidth = container.height * imageAspectRatio;
            }

            const overhangX = Math.max(0, (renderedWidth * currentScale - container.width) / 2);
            const overhangY = Math.max(0, (renderedHeight * currentScale - container.height) / 2);

            setDragConstraints({ left: -overhangX, right: overhangX, top: -overhangY, bottom: overhangY });
            
            x.set(clamp(currentX, -overhangX, overhangX));
            y.set(clamp(currentY, -overhangY, overhangY));
        }
    }, [x, y, resetTransform, scale]);

    useEffect(() => {
        const unsubscribe = scale.onChange(updateConstraints);
        return () => unsubscribe();
    }, [scale, updateConstraints]);
    
    const handleZoom = useCallback((delta: number, clientX?: number, clientY?: number) => {
        const currentScale = scale.get();
        const newScale = clamp(currentScale + delta, 1, 8);
        const scaleRatio = newScale / currentScale;

        const currentX = x.get();
        const currentY = y.get();
        
        if (containerRef.current && clientX && clientY) {
            const rect = containerRef.current.getBoundingClientRect();
            const pointerX = clientX - rect.left - rect.width / 2;
            const pointerY = clientY - rect.top - rect.height / 2;
            
            const newX = pointerX + (currentX - pointerX) * scaleRatio;
            const newY = pointerY + (currentY - pointerY) * scaleRatio;
            
            x.set(newX);
            y.set(newY);
        }
        scale.set(newScale);
    }, [scale, x, y]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleZoom(e.deltaY * -0.01, e.clientX, e.clientY);
    }, [handleZoom]);

    const isZoomed = scale.get() > 1.001;
    
    const downloadUrl = imageUrl ? `${imageUrl.split('?')[0]}?dl` : '';

    const lightboxContent = (
        <AnimatePresence>
            {isOpen && imageUrl && (
                <motion.div className={styles.lightboxOverlay} onWheel={handleWheel} onClick={closeLightbox} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div ref={containerRef} className={styles.imageContainer} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{type: 'spring', damping: 25, stiffness: 250}}>
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentIndex}
                                ref={imageRef}
                                drag={isZoomed}
                                dragConstraints={dragConstraints}
                                dragElastic={0}
                                dragMomentum={false}
                                src={imageUrl}
                                alt="Full resolution view"
                                className={styles.lightboxImage}
                                style={{ 
                                    scale: animatedScale, 
                                    x: animatedX, 
                                    y: animatedY 
                                }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            />
                        </AnimatePresence>
                    </motion.div>
                    
                    <div className={styles.controls} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.controlButton} onClick={() => handleZoom(0.5)} title="Zoom In"><ZoomInIcon /></button>
                        <button className={styles.controlButton} onClick={() => handleZoom(-0.5)} title="Zoom Out"><ZoomOutIcon /></button>
                        <button className={styles.controlButton} onClick={resetTransform} title="Reset Zoom"><ResetIcon /></button>
                        <a href={downloadUrl} download className={styles.controlButton} title="Download Image"><DownloadIcon /></a>
                        <button className={styles.controlButton} onClick={closeLightbox} title="Close"><CloseIcon /></button>
                    </div>

                    {imageUrls.length > 1 && (
                        <>
                            <button className={`${styles.navButton} ${styles.prev}`} onClick={(e) => { e.stopPropagation(); goToPrevious(); }}><ArrowIcon dir="left" /></button>
                            <button className={`${styles.navButton} ${styles.next}`} onClick={(e) => { e.stopPropagation(); goToNext(); }}><ArrowIcon dir="right" /></button>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (!isMounted) return null;
    return createPortal(lightboxContent, document.body);
}





