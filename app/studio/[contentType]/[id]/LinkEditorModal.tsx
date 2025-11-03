// app/studio/[contentType]/[id]/LinkEditorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import editorStyles from './Editor.module.css'; // <-- IMPORTED for input styles
import modalStyles from '@/components/modals/Modals.module.css'; // <-- IMPORTED for modal layout

interface LinkEditorModalProps { isOpen: boolean; onClose: () => void; onSubmit: (url: string) => void; onRemove: () => void; initialUrl?: string; }
const modalVariants = { hidden: { opacity: 0, scale: 0.9, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 250 } }, exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } }, };

export function LinkEditorModal({ isOpen, onClose, onSubmit, onRemove, initialUrl }: LinkEditorModalProps) {
    const [url, setUrl] = useState('');

    useEffect(() => { if (isOpen) { setUrl(initialUrl || ''); } }, [isOpen, initialUrl]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (url.trim()) { onSubmit(url); } };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div onMouseDown={(e) => e.preventDefault()} className={modalStyles.modalOverlay} style={{ zIndex: 5001, backgroundColor: 'transparent', backdropFilter: 'none' }} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className={modalStyles.modalContent} style={{ padding: '2rem', maxWidth: '400px' }} variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleSubmit}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontFamily: 'var(--font-ui)' }}>تعديل الرابط</h3>
                            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className={editorStyles.sidebarInput} autoFocus style={{ marginBottom: '1.5rem' }} />
                            <div className={modalStyles.modalActions} style={{ justifyContent: 'space-between' }}>
                                {initialUrl && (<button type="button" onClick={onRemove} className="outline-button" style={{ borderColor: '#DC2626', color: '#DC2626' }}>إزالة الرابط</button>)}
                                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                                    <button type="button" onClick={onClose} className="outline-button">إلغاء</button>
                                    <button type="submit" className="primary-button">تطبيق</button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}


