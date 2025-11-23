// app/studio/[contentType]/[id]/metadata/GameInput.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createGameAction } from '../../../actions';
import { AddGameModal } from './AddGameModal';
import ActionButton from '@/components/ActionButton';
import styles from '../Editor.module.css';
import metadataStyles from './Metadata.module.css';

type Game = { _id: string; title: string };
interface GameInputProps { 
    allGames: Game[]; 
    selectedGame: Game | null; 
    onGameSelect: (game: Game | null) => void; 
}

const popoverVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, };

export function GameInput({ allGames, selectedGame, onGameSelect }: GameInputProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredGames = useMemo(() => {
        if (!searchTerm) return allGames;
        const lowerSearch = searchTerm.toLowerCase();
        return allGames.filter(g => g.title.toLowerCase().includes(lowerSearch));
    }, [allGames, searchTerm]);

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

    const handleSelect = (game: Game) => { 
        onGameSelect(game); 
        setIsPopoverOpen(false); 
    };
    
    const handleOpenModal = () => { setIsPopoverOpen(false); setIsAddGameModalOpen(true); };
    const handleCreateGame = async (title: string) => { const newGame = await createGameAction(title); if (newGame) { onGameSelect(newGame); } setIsAddGameModalOpen(false); setSearchTerm(''); };
    
    return (
        <>
            <AddGameModal isOpen={isAddGameModalOpen} onClose={() => setIsAddGameModalOpen(false)} onSubmit={handleCreateGame} initialValue={searchTerm} />
            <div className={styles.sidebarSection} ref={wrapperRef}>
                <label className={styles.sidebarLabel}>اللعبة</label>
                <div className={metadataStyles.inputWrapper} style={{ position: 'relative' }}>
                    <div 
                        className={styles.sidebarInput} 
                        style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            cursor: selectedGame ? 'default' : 'text',
                            paddingRight: '0.5rem',
                        }} 
                        onClick={() => {if (!selectedGame) setIsPopoverOpen(true)}}
                    >
                        <span>{selectedGame ? selectedGame.title : 'ابحث عن لعبة...'}</span>
                    </div>
                    
                    {selectedGame ? (
                        <ActionButton type="button" onClick={(e) => { e.preventDefault(); onGameSelect(null); }} aria-label="Remove selected game">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </ActionButton>
                    ) : (
                        <ActionButton type="button" onClick={(e) => { e.preventDefault(); handleOpenModal(); }} aria-label="إضافة لعبة جديدة">
                             <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        </ActionButton>
                    )}
                    
                    <AnimatePresence>
                        {isPopoverOpen && !selectedGame && (
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
                                    {filteredGames.length > 0 ? filteredGames.map(game => (
                                        <button 
                                            type="button" 
                                            key={game._id} 
                                            // FIX: Use onMouseDown for reliable selection
                                            onMouseDown={(e) => { 
                                                e.preventDefault(); 
                                                e.stopPropagation();
                                                handleSelect(game); 
                                            }}
                                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} 
                                            className={styles.popoverItemButton}
                                        >
                                            {game.title}
                                        </button>
                                    ))
                                     : searchTerm.length > 1 && <p style={{padding:'0.5rem', color:'var(--text-secondary)'}}>لا نتائج.</p>
                                    }
                                    
                                    {searchTerm.length > 1 && (
                                        <button 
                                            type="button" 
                                            // FIX: Use onMouseDown here as well
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