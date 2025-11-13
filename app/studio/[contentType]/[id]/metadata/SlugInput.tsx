// app/studio/[contentType]/[id]/metadata/SlugInput.tsx
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../Editor.module.css';

// THE DEFINITIVE FIX: Added `overflow: 'visible'` to the SVG style.
const AnimatedLockIcon = ({ isLocked }: { isLocked: boolean }) => (
    <svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ overflow: 'visible' }}
    >
        {/* Lock Body - Static */}
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        {/* Shackle - Animated */}
        <motion.path
            d="M7 11V7a5 5 0 0 1 10 0v4"
            initial={false}
            animate={{
                rotate: isLocked ? 0 : -25,
                y: isLocked ? 0 : -2,
            }}
            style={{ transformOrigin: '7px 11px' }} // Pivot around the left base of the shackle
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        />
    </svg>
);

const AlertIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const ClockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

interface SlugInputProps {
    slug: string;
    title: string;
    docId: string;
    isSlugManual: boolean;
    slugValidationStatus: 'pending' | 'valid' | 'invalid';
    slugValidationMessage: string;
    dispatch: (action: { type: string; payload: any }) => void;
}

export function SlugInput({
    slug, title, docId, isSlugManual,
    slugValidationStatus, slugValidationMessage, dispatch
}: SlugInputProps) {
    const [isTranslating, startTranslation] = useTransition();
    const debouncedTitle = useDebounce(title, 800);

    const translateAndSetSlug = useCallback(async (currentTitle: string) => {
        if (!currentTitle.trim()) return;
        startTranslation(async () => {
            try {
                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: currentTitle }),
                });
                if (!response.ok) throw new Error('Translation failed');
                const data = await response.json();
                dispatch({ type: 'UPDATE_SLUG', payload: { slug: data.slug, isManual: false } });
            } catch (error) {
                console.error("Translation error:", error);
            }
        });
    }, [dispatch]);

    useEffect(() => {
        if (!isSlugManual && debouncedTitle) {
            translateAndSetSlug(debouncedTitle);
        }
    }, [debouncedTitle, isSlugManual, translateAndSetSlug]);

    const handleLockToggle = () => {
        const currentlyManual = !isSlugManual;
        dispatch({ type: 'UPDATE_FIELD', payload: { field: 'isSlugManual', value: currentlyManual } });
        // If we are locking it back, re-translate immediately
        if (!currentlyManual) {
            translateAndSetSlug(title);
        }
    };

    const isSlugValid = slugValidationStatus === 'valid';
    const isSlugPending = slugValidationStatus === 'pending';

    const getSlugIcon = () => {
        if (isTranslating || isSlugPending) return <ClockIcon />;
        if (isSlugValid) return <CheckIcon />;
        return <AlertIcon />;
    };

    return (
        <motion.div className={styles.sidebarSection} layout>
            <label className={styles.sidebarLabel}>
                المُعرِّف (Slug)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <motion.button
                    type="button"
                    onClick={handleLockToggle}
                    className={styles.iconButton}
                    style={{ flexShrink: 0, width: '42px', height: '42px' }}
                    aria-label={isSlugManual ? "Lock to auto-translate" : "Unlock to enable manual editing"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <AnimatedLockIcon isLocked={!isSlugManual} />
                </motion.button>
                <input
                    type="text"
                    value={slug}
                    onChange={(e) => dispatch({ type: 'UPDATE_SLUG', payload: { slug: e.target.value, isManual: true } })}
                    className={styles.sidebarInput}
                    style={{
                        flexGrow: 1,
                        borderColor: isSlugValid && !isSlugPending ? '#16A34A' : isSlugPending ? 'var(--border-color)' : '#DC2626',
                        direction: 'ltr',
                        textAlign: 'left',
                        backgroundColor: isSlugManual ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                    }}
                    readOnly={!isSlugManual}
                />
            </div>
            <AnimatePresence>
                {(slugValidationMessage && (slugValidationStatus !== 'valid' || isTranslating)) && (
                    <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: isTranslating || isSlugPending ? 'var(--text-secondary)' : '#DC2626',
                            fontSize: '1.2rem', marginTop: '0.5rem', textAlign: 'right'
                        }}
                    >
                        {getSlugIcon()}
                        <span>{isTranslating ? 'جارٍ الترجمة...' : slugValidationMessage}</span>
                    </motion.p>
                )}
            </AnimatePresence>
        </motion.div>
    );
}