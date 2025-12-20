// components/studio/social/weekly-news/SmartFillerWeekly.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';
import { getRecentWeeksAction, getNewsForWeekAction, WeeklyNewsItem, WeekOption } from '@/app/studio/social-templates/weekly-news/actions';
import Image from 'next/image';
import { sanityLoader } from '@/lib/sanity.loader';
import { WeeklyNewsTemplateData, WeeklyListItem } from './types';

interface SmartFillerWeeklyProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (data: Partial<WeeklyNewsTemplateData>) => void;
    currentData: WeeklyNewsTemplateData; // NEW PROP
}

const AddIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const ArrowUpIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>;
const ArrowDownIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>;

export default function SmartFillerWeekly({ isOpen, onClose, onApply, currentData }: SmartFillerWeeklyProps) {
    const [weeks, setWeeks] = useState<WeekOption[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
    const [newsItems, setNewsItems] = useState<WeeklyNewsItem[]>([]);
    const [isPending, startTransition] = useTransition();

    // Assignment State
    const [assignedHero, setAssignedHero] = useState<WeeklyNewsItem | null>(null);
    const [assignedCards, setAssignedCards] = useState<(WeeklyNewsItem | null)[]>([null, null, null]);
    
    // Map list items back to a structure compatible with WeeklyNewsItem for display
    const [assignedList, setAssignedList] = useState<{ item: WeeklyNewsItem, isImportant: boolean }[]>([]);

    // --- HYDRATION LOGIC ---
    useEffect(() => {
        if (isOpen && currentData) {
            // Reconstruct WeeklyNewsItem from currentData where possible
            // Note: We might be missing fields like 'publishedAt' if we rely solely on template data.
            // But we have 'sourceId' now which helps identification.
            
            // 1. Hero
            if (currentData.hero.sourceId || currentData.hero.title) {
                setAssignedHero({
                    _id: currentData.hero.sourceId || 'manual-hero',
                    title: currentData.hero.title.replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML for list view
                    imageUrl: currentData.hero.image,
                    publishedAt: '', // Unknown
                    category: currentData.hero.tag
                });
            }

            // 2. Cards
            const newCards = currentData.cards.map(c => {
                if (!c.title) return null;
                return {
                    _id: c.sourceId || `manual-card-${c.id}`,
                    title: c.title.replace(/<\/?[^>]+(>|$)/g, ""),
                    imageUrl: c.image,
                    publishedAt: ''
                } as WeeklyNewsItem;
            });
            setAssignedCards(newCards);

            // 3. List
            const newList = currentData.newsList.map(l => ({
                item: {
                    _id: l.sourceId || `manual-list-${l.id}`,
                    title: l.text.replace(/<\/?[^>]+(>|$)/g, ""),
                    imageUrl: '', // List items usually don't show image in template, but we can't recover it if lost
                    publishedAt: ''
                },
                isImportant: l.isImportant
            }));
            setAssignedList(newList);

            // Fetch weeks
            startTransition(async () => {
                const recentWeeks = await getRecentWeeksAction();
                setWeeks(recentWeeks);
                if (recentWeeks.length > 0) {
                    setSelectedWeek(recentWeeks[0]);
                    const news = await getNewsForWeekAction(recentWeeks[0].startDate, recentWeeks[0].endDate);
                    setNewsItems(news);
                }
            });
        }
    }, [isOpen, currentData]);

    // ... (Handlers for WeekChange, Toggles same as before) ...
    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const week = weeks.find(w => w.startDate === e.target.value);
        if (week) {
            setSelectedWeek(week);
            startTransition(async () => {
                const news = await getNewsForWeekAction(week.startDate, week.endDate);
                setNewsItems(news);
            });
        }
    };

    const toggleAssignHero = (item: WeeklyNewsItem) => {
        setAssignedHero(prev => prev?._id === item._id ? null : item);
    };

    const toggleAssignCard = (item: WeeklyNewsItem) => {
        const idx = assignedCards.findIndex(c => c?._id === item._id);
        if (idx !== -1) {
            const newCards = [...assignedCards];
            newCards[idx] = null;
            setAssignedCards(newCards);
        } else {
            const emptyIdx = assignedCards.findIndex(c => c === null);
            const targetIdx = emptyIdx !== -1 ? emptyIdx : 2; // Default to last if full
            const newCards = [...assignedCards];
            newCards[targetIdx] = item;
            setAssignedCards(newCards);
        }
    };

    const toggleAssignList = (item: WeeklyNewsItem) => {
        const exists = assignedList.some(l => l.item._id === item._id);
        if (exists) {
            setAssignedList(prev => prev.filter(l => l.item._id !== item._id));
        } else {
            if (assignedList.length >= 10) return;
            setAssignedList([...assignedList, { item, isImportant: false }]);
        }
    };

    const handleRemoveCard = (index: number) => {
        setAssignedCards(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    const handleRemoveList = (index: number) => {
        setAssignedList(prev => prev.filter((_, i) => i !== index));
    };
    
    // NEW: Re-ordering functionality for List
    const moveListItem = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= assignedList.length) return;
        
        const newList = [...assignedList];
        const [movedItem] = newList.splice(index, 1);
        newList.splice(newIndex, 0, movedItem);
        setAssignedList(newList);
    };

    const toggleImportant = (index: number) => {
        setAssignedList(prev => {
            const next = [...prev];
            next[index] = { ...next[index], isImportant: !next[index].isImportant };
            return next;
        });
    };

    const handleFinalApply = () => {
        const newData: any = {};
        
        if (selectedWeek) {
            newData.weekNumber = `الأسبوع ${selectedWeek.weekNum}`;
            newData.year = selectedWeek.year.toString();
        }

        if (assignedHero) {
            newData.hero = {
                sourceId: assignedHero._id,
                title: assignedHero.title,
                image: assignedHero.imageUrl || '',
                tag: 'خبر عاجل',
                imageSettings: { x: 0, y: 0, scale: 1 },
                // Preserve badges if not fully replacing logic, but for simplicity we reset badges on new assignment
                badges: { type: 'official', xbox: false, playstation: false, nintendo: false, pc: false }
            };
        }

        const validCards = assignedCards.map((c, i) => c ? ({
            sourceId: c._id,
            id: i + 1,
            title: c.title,
            image: c.imageUrl || '',
            imageSettings: { x: 0, y: 0, scale: 1 },
            badges: { type: 'official', xbox: false, playstation: false, nintendo: false, pc: false }
        }) : null).filter(Boolean);
        
        if (validCards.length > 0) {
            newData.cards = validCards;
        }

        if (assignedList.length > 0) {
            newData.newsList = assignedList.map((item, i) => ({
                sourceId: item.item._id,
                id: i + 5,
                number: (i + 5).toString().padStart(2, '0'),
                text: item.item.title,
                isImportant: item.isImportant,
                type: 'official' // Reset type on smart fill apply
            }));
        }

        onApply(newData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ maxWidth: '95vw', width: '1200px', height: '85vh', display: 'flex', flexDirection: 'column', padding: '0' }}>
            <div style={{ padding: '2rem 2rem 1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-main)' }}>إدارة محتوى النشرة</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                     <select 
                        className="profile-input" 
                        style={{ height: '40px', padding: '0 3rem 0 1rem', width: 'auto' }}
                        onChange={handleWeekChange}
                        value={selectedWeek?.startDate || ''}
                    >
                        {weeks.map(w => (
                            <option key={w.startDate} value={w.startDate}>{w.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT: Available News */}
                <div style={{ width: '40%', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
                     <div style={{ padding: '1rem', fontWeight: 'bold' }}>الأخبار المتاحة</div>
                     <div style={{ overflowY: 'auto', flexGrow: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {isPending ? <div className="spinner" style={{ margin: 'auto' }} /> : 
                         newsItems.map(item => {
                            const isHero = assignedHero?._id === item._id;
                            const isCard = assignedCards.some(c => c?._id === item._id);
                            const isList = assignedList.some(l => l.item._id === item._id);
                            return (
                                <div key={item._id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                        {item.imageUrl && <Image src={item.imageUrl} alt="" width={60} height={40} style={{ borderRadius: '4px', objectFit: 'cover' }} loader={sanityLoader} />}
                                        <div><p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{item.title}</p></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => toggleAssignHero(item)} className={isHero ? "primary-button" : "outline-button"} style={{ padding: '0.3rem 0.8rem', fontSize: '1rem' }}>Hero</button>
                                        <button onClick={() => toggleAssignCard(item)} className={isCard ? "primary-button" : "outline-button"} style={{ padding: '0.3rem 0.8rem', fontSize: '1rem' }}>Card</button>
                                        <button onClick={() => toggleAssignList(item)} className={isList ? "primary-button" : "outline-button"} style={{ padding: '0.3rem 0.8rem', fontSize: '1rem' }}>List</button>
                                    </div>
                                </div>
                            );
                         })}
                     </div>
                </div>

                {/* RIGHT: Assignments (Manager) */}
                <div style={{ width: '60%', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '2rem', gap: '2rem', backgroundColor: '#050505' }}>
                    {/* ... Hero & Cards sections same as before ... */}
                    
                    {/* List Assignment with Ordering */}
                    <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '1rem', background: '#111', flexGrow: 1 }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#00FFF0' }}>قائمة الأخبار (News List)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {assignedList.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1A1A1A', padding: '0.5rem', borderRadius: '4px' }}>
                                    {/* Reorder Controls */}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <button onClick={() => moveListItem(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: '#555', cursor: i===0?'default':'pointer' }}><ArrowUpIcon /></button>
                                        <button onClick={() => moveListItem(i, 1)} disabled={i === assignedList.length - 1} style={{ background: 'none', border: 'none', color: '#555', cursor: i===assignedList.length-1?'default':'pointer' }}><ArrowDownIcon /></button>
                                    </div>
                                    
                                    <span style={{ color: '#00FFF0', fontFamily: 'monospace', width: '25px', textAlign: 'center' }}>{(i + 5).toString().padStart(2, '0')}</span>
                                    <p style={{ margin: 0, color: '#fff', flexGrow: 1, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.item.title}</p>
                                    
                                    <button 
                                        onClick={() => toggleImportant(i)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.isImportant ? '#00FFF0' : '#444' }}
                                    >
                                        <CheckIcon />
                                    </button>

                                    <button onClick={() => handleRemoveList(i)} style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}><TrashIcon /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className={modalStyles.modalActions} style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={onClose} className="outline-button">إلغاء</button>
                <button onClick={handleFinalApply} className="primary-button">تطبيق التغييرات</button>
            </div>
        </Modal>
    );
}


