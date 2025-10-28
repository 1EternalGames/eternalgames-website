// app/studio/[contentType]/[id]/metadata/TagInput.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTagAction } from '../../../actions';
import { AddTagModal } from './AddTagModal';
import ActionButton from '@/components/ActionButton';
import { translateTag } from '@/lib/translations';
import styles from '../Editor.module.css';
import metadataStyles from './Metadata.module.css';

type Tag = { _id: string; title: string };
interface TagInputProps { allTags: Tag[]; selectedTags: Tag[]; onTagsChange: (tags: Tag[]) => void; }

const popoverVariants = { 
    hidden: { opacity: 0, y: -10, scale: 0.95 }, 
    visible: { opacity: 1, y: 0, scale: 1 }, 
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.1 } }, 
};

const AnimatedTag = ({ tag, onRemove }: { tag: Tag, onRemove: (tagId: string) => void }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const tagVariants = { initial: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1 }, exiting: { opacity: 0, scale: 0.6, transition: { duration: 0.2, ease: 'easeOut' } }, };
    const handleRemove = (e: React.MouseEvent) => { e.stopPropagation(); setIsDeleting(true); };
    return (
        <motion.div onClick={handleRemove} layout variants={tagVariants} initial="initial" animate={isDeleting ? "exiting" : "visible"} exit="exiting" onAnimationComplete={() => { if (isDeleting) { onRemove(tag._id); } }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem 0.75rem', borderRadius: '4px', zIndex: 1, cursor: 'pointer' }} title={`Click to remove "${translateTag(tag.title)}"`} whileHover={{ backgroundColor: 'color-mix(in srgb, #DC2626 15%, transparent)' }}>
            <span>{translateTag(tag.title)}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </motion.div>
    );
};

export function TagInput({ allTags, selectedTags, onTagsChange }: TagInputProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredResults = (searchTerm
        ? allTags.filter(tag => 
            tag.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            translateTag(tag.title).toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allTags
    ).filter(tag => !selectedTags.some(st => st._id === tag._id));
    
    useEffect(() => { 
        const handleClickOutside = (event: MouseEvent) => { 
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) { 
                setIsPopoverOpen(false); 
            } 
        }; 
        document.addEventListener('mousedown', handleClickOutside); 
        return () => document.removeEventListener('mousedown', handleClickOutside); 
    }, []);
    
    useEffect(() => { 
        if (isPopoverOpen) { 
            setTimeout(() => inputRef.current?.focus(), 100); 
        } else { 
            setSearchTerm(''); 
        } 
    }, [isPopoverOpen]);

    const addTag = (tag: Tag) => { if (!selectedTags.some(t => t._id === tag._id)) { onTagsChange([...selectedTags, tag]); } setSearchTerm(''); inputRef.current?.focus(); };
    const removeTag = (tagIdToRemove: string) => { onTagsChange(selectedTags.filter(tag => tag._id !== tagIdToRemove)); };
    const handleOpenModal = () => { setIsPopoverOpen(false); setIsAddTagModalOpen(true); };
    const handleCreateTag = async (title: string) => { const newTag = await createTagAction(title); if (newTag) { addTag(newTag); } setIsAddTagModalOpen(false); setSearchTerm(''); };
    
    const showCreateOption = searchTerm.trim().length > 1 && !allTags.some(r => r.title.toLowerCase() === searchTerm.toLowerCase());
    
    return (
        <>
            <AddTagModal isOpen={isAddTagModalOpen} onClose={() => setIsAddTagModalOpen(false)} onSubmit={handleCreateTag} initialValue={searchTerm} />
            <div className={styles.sidebarSection} ref={wrapperRef}>
                <label className={styles.sidebarLabel}>الوسوم</label>
                <div className={metadataStyles.inputWrapper} style={{ position: 'relative' }}>
                    <div 
                        className={styles.sidebarInput} 
                        style={{ 
                            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', 
                            minHeight: '42px', height: 'auto', padding: '0.5rem', cursor: 'text',
                        }} 
                        onClick={() => setIsPopoverOpen(true)}
                    >
                        <AnimatePresence>{selectedTags.map(tag => (<AnimatedTag key={tag._id} tag={tag} onRemove={removeTag} />))}</AnimatePresence>
                        {selectedTags.length === 0 && !isPopoverOpen && (
                            <span style={{ color: 'var(--text-secondary)', position: 'absolute', right: '1rem', left: 'auto', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>انقر لإضافة الوسوم...</span>
                        )}
                    </div>
                     <ActionButton type="button" onClick={handleOpenModal} aria-label="إضافة وسم جديد">
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
                                    borderRadius: '6px', zIndex: 10, 
                                    padding: '0.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', marginTop: '0.5rem'
                                }}
                            >
                                <input ref={inputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search or create a tag..." className={styles.sidebarInput} style={{ marginBottom: '0.5rem' }} />
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                    {filteredResults.map(tag => ( <button type="button" key={tag._id} onClick={() => addTag(tag)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', borderRadius: '4px' }} className={styles.popoverItemButton}> {translateTag(tag.title)} </button> ))}
                                    {showCreateOption && (
                                        <button type="button" onClick={handleOpenModal} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontStyle: 'italic' }} className={styles.popoverItemButton}>
                                            + Create new tag: "{searchTerm.trim()}"
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