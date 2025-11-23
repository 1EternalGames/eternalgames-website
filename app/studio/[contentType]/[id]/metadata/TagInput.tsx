// app/studio/[contentType]/[id]/metadata/TagInput.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTagAction } from '../../../actions';
import { AddTagModal } from './AddTagModal';
import ActionButton from '@/components/ActionButton';
import { translateTag } from '@/lib/translations';
import styles from '../Editor.module.css';
import metadataStyles from './Metadata.module.css';

type Tag = { _id: string; title: string, category?: string };
interface TagInputProps { 
    label: string; 
    allTags: Tag[]; 
    selectedTags: Tag[]; 
    onTagsChange: (tags: any) => void;
    placeholder?: string;
    singleSelection?: boolean;
    categoryForCreation: 'Game' | 'Article' | 'News';
}

const popoverVariants = { 
    hidden: { opacity: 0, y: -10, scale: 0.95 }, 
    visible: { opacity: 1, y: 0, scale: 1 }, 
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.1 } }, 
};

const AnimatedTag = ({ tag, onRemove }: { tag: Tag, onRemove: (tagId: string) => void }) => {
    if (!tag || typeof tag.title !== 'string') return null;
    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, scale: 0.5 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.6 }} 
            // FIX: Use onClick for reliable interaction
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(tag._id); }} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem 0.75rem', borderRadius: '4px', zIndex: 1, cursor: 'pointer' }} 
            title={`Click to remove "${translateTag(tag.title)}"`} 
            whileHover={{ backgroundColor: 'color-mix(in srgb, #DC2626 15%, transparent)' }}
        >
            <span>{translateTag(tag.title)}</span>
            <svg width="12" height="12" viewBox="0 0 24" style={{ flexShrink: 0 }}><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </motion.div>
    );
};

export function TagInput({ label, allTags, selectedTags = [], onTagsChange, placeholder = "ابحث...", singleSelection = false, categoryForCreation }: TagInputProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const safeSelectedTags = (selectedTags || []).filter(Boolean);

    const filteredTags = useMemo(() => {
        let available = allTags.filter(t => !safeSelectedTags.some(st => st._id === t._id));
        
        if (categoryForCreation) {
            available = available.filter(t => t.category === categoryForCreation);
        }

        if (!searchTerm) return available;
        
        const lowerSearch = searchTerm.toLowerCase();
        return available.filter(t => 
            t.title.toLowerCase().includes(lowerSearch) || 
            translateTag(t.title).toLowerCase().includes(lowerSearch)
        );
    }, [allTags, safeSelectedTags, searchTerm, categoryForCreation]);

    useEffect(() => { 
        const handleClickOutside = (event: MouseEvent) => { 
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) { setIsPopoverOpen(false); } 
        }; 
        document.addEventListener('mousedown', handleClickOutside); 
        return () => document.removeEventListener('mousedown', handleClickOutside); 
    }, []);
    
    useEffect(() => { 
        if (isPopoverOpen) { setTimeout(() => inputRef.current?.focus(), 100); } 
        else { setSearchTerm(''); } 
    }, [isPopoverOpen]);

    const handleSelectTag = (tag: Tag) => {
        if (singleSelection) {
            onTagsChange([tag]);
            setIsPopoverOpen(false);
        } else {
            if (!safeSelectedTags.some(t => t._id === tag._id)) {
                onTagsChange([...safeSelectedTags, tag]);
            }
        }
        setSearchTerm('');
        if (inputRef.current) inputRef.current.focus();
    };
    
    const handleRemoveTag = (tagIdToRemove: string) => {
        if (singleSelection) { onTagsChange([]); } 
        else { onTagsChange(safeSelectedTags.filter(tag => tag._id !== tagIdToRemove)); }
    };
    
    const handleOpenModal = () => { setIsPopoverOpen(false); setIsAddTagModalOpen(true); };
    const handleCreateTag = async (title: string) => { 
        const newTag = await createTagAction(title, categoryForCreation); 
        if (newTag) { handleSelectTag(newTag); } 
        setIsAddTagModalOpen(false); 
        setSearchTerm(''); 
    };
    
    const hasSelection = safeSelectedTags.length > 0;

    return (
        <>
            <AddTagModal isOpen={isAddTagModalOpen} onClose={() => setIsAddTagModalOpen(false)} onSubmit={handleCreateTag} initialValue={searchTerm} />
            <div className={styles.sidebarSection} ref={wrapperRef}>
                <label className={styles.sidebarLabel}>{label}</label>
                <div className={metadataStyles.inputWrapper} style={{ position: 'relative' }}>
                    <div 
                        className={styles.sidebarInput} 
                        style={{ 
                            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', 
                            minHeight: '42px', height: 'auto', padding: '0.5rem', cursor: 'text',
                        }} 
                        onClick={() => setIsPopoverOpen(true)}
                    >
                        <AnimatePresence>
                            {safeSelectedTags.map(tag => (
                                tag && tag._id ? <AnimatedTag key={tag._id} tag={tag} onRemove={handleRemoveTag} /> : null
                            ))}
                        </AnimatePresence>
                        {!hasSelection && !isPopoverOpen && (
                            <span style={{ color: 'var(--text-secondary)', position: 'absolute', right: '1rem', left: 'auto', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>{placeholder}</span>
                        )}
                    </div>
                     <ActionButton type="button" onClick={(e) => { e.preventDefault(); handleOpenModal(); }} aria-label="Add new tag or category">
                        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    </ActionButton>
                    
                    <AnimatePresence>
                        {isPopoverOpen && (
                            <motion.div 
                                onClick={(e) => e.stopPropagation()}
                                variants={popoverVariants} initial="hidden" animate="visible" exit="exit" 
                                style={{ 
                                    position: 'absolute', top: '100%', left: 0, 
                                    width: '100%',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    borderRadius: '6px', zIndex: 100, 
                                    padding: '0.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', marginTop: '0.5rem'
                                }}
                            >
                                <input ref={inputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={placeholder} className={styles.sidebarInput} style={{ marginBottom: '0.5rem' }} />
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                    {filteredTags.length > 0 ? filteredTags.map(tag => ( 
                                        <button 
                                            type="button" 
                                            key={tag._id} 
                                            // FIX: Use onClick for reliable selection
                                            onClick={(e) => { 
                                                e.preventDefault(); 
                                                e.stopPropagation();
                                                handleSelectTag(tag); 
                                            }}
                                            style={{ display: 'block', width: '100%', textAlign: 'right', padding: '0.6rem 0.8rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', borderRadius: '4px' }} 
                                            className={styles.popoverItemButton}
                                        > 
                                            {translateTag(tag.title)} 
                                        </button> 
                                    ))
                                     : <div style={{padding:'0.5rem'}}>لا نتائج.</div>
                                    }
                                    
                                    {searchTerm.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenModal(); }}
                                            style={{ display: 'block', width: '100%', textAlign: 'right', padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)' }} 
                                            className={styles.popoverItemButton}
                                        >
                                            + إنشاء جديد: "{searchTerm.trim()}"
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}