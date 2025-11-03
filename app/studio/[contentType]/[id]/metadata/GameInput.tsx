// app/studio/[contentType]/[id]/metadata/GameInput.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createGameAction } from '../../../actions';
import { AddGameModal } from './AddGameModal';
import ActionButton from '@/components/ActionButton';
import styles from '../Editor.module.css';
import metadataStyles from './Metadata.module.css';

type Game = { _id: string; title: string };
interface GameInputProps { allGames: Game[]; selectedGame: Game | null; onGameSelect: (game: Game | null) => void; }
const popoverVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, };
const itemVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 }, };

export function GameInput({ allGames, selectedGame, onGameSelect }: GameInputProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredResults = searchTerm
        ? allGames.filter(game => game.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : allGames;

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

    const handleSelect = (game: Game) => { onGameSelect(game); setIsPopoverOpen(false); };
    const handleOpenModal = () => { setIsPopoverOpen(false); setIsAddGameModalOpen(true); };
    const handleCreateGame = async (title: string) => { const newGame = await createGameAction(title); if (newGame) { onGameSelect(newGame); } setIsAddGameModalOpen(false); setSearchTerm(''); };
    
    const showCreateOption = searchTerm.trim().length > 1 && !filteredResults.some(r => r.title.toLowerCase() === searchTerm.toLowerCase());
    
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
                        <span>{selectedGame ? selectedGame.title : 'ابحث عن لعبة أو أنشئها...'}</span>
                    </div>
                    
                    {selectedGame ? (
                        <ActionButton type="button" onClick={() => onGameSelect(null)} aria-label="Remove selected game">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </ActionButton>
                    ) : (
                        <ActionButton type="button" onClick={handleOpenModal} aria-label="إضافة لعبة جديدة">
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
                                    borderRadius: '6px', zIndex: 10, marginTop: '0.5rem',
                                    padding: '0.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                                }}
                            >
                                <input ref={inputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for a game..." className={styles.sidebarInput} style={{ marginBottom: '0.5rem' }} />
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                    {filteredResults.map(game => (<motion.button type="button" key={game._id} variants={itemVariants} onClick={() => handleSelect(game)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} whileHover={{ backgroundColor: 'var(--bg-primary)' }}>{game.title}</motion.button>))}
                                    {showCreateOption && (
                                        <motion.button type="button" variants={itemVariants} onClick={handleOpenModal} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontStyle: 'italic' }} whileHover={{ backgroundColor: 'var(--bg-primary)' }}>
                                            + Create new game: "{searchTerm.trim()}"
                                        </motion.button>
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


