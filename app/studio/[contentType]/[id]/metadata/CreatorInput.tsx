// app/studio/[contentType]/[id]/metadata/CreatorInput.tsx
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../Editor.module.css';
import metadataStyles from './Metadata.module.css';
import filterStyles from '@/components/filters/Filters.module.css';
import { searchCreatorsAction } from '../../../actions';
import { useDebounce } from '@/hooks/useDebounce';

type Creator = { _id: string; name: string };
interface CreatorInputProps { 
    label: string; 
    // Removed allCreators prop
    selectedCreators: Creator[]; 
    onCreatorsChange: (creators: Creator[]) => void; 
    // Need to know which role to search for
    role: 'REVIEWER' | 'AUTHOR' | 'REPORTER' | 'DESIGNER';
}

const popoverVariants = { 
    hidden: { opacity: 0, y: -10, scale: 0.95 }, 
    visible: { opacity: 1, y: 0, scale: 1 }, 
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.1 } }, 
};

const CreatorChip = ({ creator, onRemove }: { creator: Creator, onRemove: (creatorId: string) => void }) => {
    return (
        <motion.div onClick={(e) => { e.stopPropagation(); onRemove(creator._id); }} layout variants={{ initial: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1 }, exiting: { opacity: 0, scale: 0.6 } }} initial="initial" animate="visible" exit="exiting" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem 0.75rem', borderRadius: '4px', zIndex: 1, cursor: 'pointer' }} title={`Click to remove "${creator.name}"`} whileHover={{ backgroundColor: 'color-mix(in srgb, #DC2626 15%, transparent)' }}>
            <span>{creator.name}</span>
            <svg width="12" height="12" viewBox="0 0 24" style={{ flexShrink: 0 }}><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </motion.div>
    );
};

export function CreatorInput({ label, selectedCreators = [], onCreatorsChange, role }: CreatorInputProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Creator[]>([]);
    const [isSearching, startSearchTransition] = useTransition();
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validSelectedCreators = (selectedCreators || []).filter(Boolean);

    useEffect(() => {
        if (debouncedSearchTerm.trim().length < 1) {
            setResults([]);
            return;
        }
        startSearchTransition(async () => {
            const foundCreators = await searchCreatorsAction(debouncedSearchTerm, role);
            setResults(foundCreators.filter(c => !validSelectedCreators.some(sel => sel._id === c._id)));
        });
    }, [debouncedSearchTerm, role, validSelectedCreators]);
    
    useEffect(() => { if (isPopoverOpen) { setTimeout(() => inputRef.current?.focus(), 100); } else { setSearchTerm(''); setResults([]); } }, [isPopoverOpen]);

    const addCreator = (creator: Creator) => {
        if (!validSelectedCreators.some(c => c._id === creator._id)) {
            onCreatorsChange([...validSelectedCreators, creator]);
        }
        setSearchTerm('');
        inputRef.current?.focus();
    };
    
    const removeCreator = (creatorIdToRemove: string) => {
        onCreatorsChange(validSelectedCreators.filter(c => c._id !== creatorIdToRemove));
    };

    return (
        <div className={styles.sidebarSection} ref={wrapperRef}>
            <label className={styles.sidebarLabel}>{label}</label>
            <div className={metadataStyles.inputWrapper} style={{ position: 'relative' }}>
                <div 
                    className={styles.sidebarInput} 
                    style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', minHeight: '42px', height: 'auto', padding: '0.5rem', cursor: 'text' }} 
                    onClick={() => setIsPopoverOpen(true)}
                >
                    <AnimatePresence>
                        {validSelectedCreators.map(creator => (<CreatorChip key={creator._id} creator={creator} onRemove={removeCreator} />))}
                    </AnimatePresence>
                    
                    {validSelectedCreators.length === 0 && !isPopoverOpen && (
                        <span style={{ color: 'var(--text-secondary)', position: 'absolute', right: '1rem', left: 'auto', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>{`انقر لإضافة ${label.toLowerCase()}`}</span>
                    )}
                </div>
                
                <AnimatePresence>
                    {isPopoverOpen && (
                        <>
                            <div className={filterStyles.popoverBackdrop} onClick={() => setIsPopoverOpen(false)}></div>
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
                                <input ref={inputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={`ابحث بالاسم...`} className={styles.sidebarInput} style={{ marginBottom: '0.5rem' }} />
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                    {isSearching ? <div style={{padding: '0.5rem'}}>...</div> :
                                     results.length > 0 ? (
                                        results.map(creator => ( <button type="button" key={creator._id} onClick={() => addCreator(creator)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', borderRadius: '4px' }} className={styles.popoverItemButton}> {creator.name} </button> ))
                                    ) : (
                                        <div style={{padding: '1rem', color: 'var(--text-secondary)'}}>لا يوجد نتائج.</div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}