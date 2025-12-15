// app/studio/[contentType]/[id]/metadata/DeveloperInput.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createDeveloperAction } from '../../../actions';
import { AddDeveloperModal } from './AddDeveloperModal';
import ActionButton from '@/components/ActionButton';
import styles from '../Editor.module.css';
import metadataStyles from './Metadata.module.css';

type Developer = { _id: string; title: string };
interface DeveloperInputProps { 
    allDevelopers: Developer[]; 
    selectedDeveloper: Developer | null; 
    onDeveloperSelect: (dev: Developer | null) => void; 
}

const popoverVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, };

export function DeveloperInput({ allDevelopers, selectedDeveloper, onDeveloperSelect }: DeveloperInputProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredDevs = useMemo(() => {
        if (!searchTerm) return allDevelopers;
        const lowerSearch = searchTerm.toLowerCase();
        return allDevelopers.filter(d => d.title.toLowerCase().includes(lowerSearch));
    }, [allDevelopers, searchTerm]);

    useEffect(() => { 
        if (isPopoverOpen) { 
            setTimeout(() => inputRef.current?.focus(), 100); 
        } else {
            setSearchTerm('');
        }
    }, [isPopoverOpen]);
    
    useEffect(() => { 
        const handleClickOutside = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) { setIsPopoverOpen(false); } }; 
        document.addEventListener('mousedown', handleClickOutside); 
        return () => document.removeEventListener('mousedown', handleClickOutside); 
    }, []);

    const handleSelect = (dev: Developer) => { 
        onDeveloperSelect(dev); 
        setIsPopoverOpen(false); 
    };
    
    const handleOpenModal = () => { setIsPopoverOpen(false); setIsAddModalOpen(true); };
    const handleCreate = async (title: string) => { const newDev = await createDeveloperAction(title); if (newDev) { onDeveloperSelect(newDev); } setIsAddModalOpen(false); setSearchTerm(''); };
    
    return (
        <>
            <AddDeveloperModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleCreate} initialValue={searchTerm} />
            <div className={styles.sidebarSection} ref={wrapperRef}>
                <label className={styles.sidebarLabel}>المطور (Developer)</label>
                <div className={metadataStyles.inputWrapper} style={{ position: 'relative' }}>
                    <div 
                        className={styles.sidebarInput} 
                        style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            cursor: selectedDeveloper ? 'default' : 'text',
                            paddingRight: '0.5rem',
                        }} 
                        onClick={() => {if (!selectedDeveloper) setIsPopoverOpen(true)}}
                    >
                        <span>{selectedDeveloper ? selectedDeveloper.title : 'ابحث عن مطور...'}</span>
                    </div>
                    
                    {selectedDeveloper ? (
                        <ActionButton type="button" onClick={(e) => { e.preventDefault(); onDeveloperSelect(null); }} aria-label="Remove selected developer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </ActionButton>
                    ) : (
                        <ActionButton type="button" onClick={(e) => { e.preventDefault(); handleOpenModal(); }} aria-label="إضافة مطور جديد">
                             <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        </ActionButton>
                    )}
                    
                    <AnimatePresence>
                        {isPopoverOpen && !selectedDeveloper && (
                            <motion.div 
                                onClick={(e) => e.stopPropagation()}
                                variants={popoverVariants} initial="hidden" animate="visible" exit="exit" 
                                style={{ 
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    borderRadius: '6px', zIndex: 100, marginTop: '0.5rem',
                                    padding: '0.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                                }}
                            >
                                <input ref={inputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث..." className={styles.sidebarInput} style={{ marginBottom: '0.5rem' }} />
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                    {filteredDevs.length > 0 ? filteredDevs.map(dev => (
                                        <button 
                                            type="button" 
                                            key={dev._id} 
                                            onMouseDown={(e) => { 
                                                e.preventDefault(); 
                                                e.stopPropagation();
                                                handleSelect(dev); 
                                            }}
                                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} 
                                            className={styles.popoverItemButton}
                                        >
                                            {dev.title}
                                        </button>
                                    ))
                                     : searchTerm.length > 1 && <p style={{padding:'0.5rem', color:'var(--text-secondary)'}}>لا نتائج.</p>
                                    }
                                    
                                    {searchTerm.length > 1 && (
                                        <button 
                                            type="button" 
                                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenModal(); }}
                                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)' }}
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