// components/studio/social/weekly-news/SmartFillerWeekly.tsx
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';
import { getRecentWeeksAction, getNewsForWeekAction, WeeklyNewsItem, WeekOption } from '@/app/studio/social-templates/weekly-news/actions';
import Image from 'next/image';
import { sanityLoader } from '@/lib/sanity.loader';
import { WeeklyNewsTemplateData } from './types';

interface SmartFillerWeeklyProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (data: Partial<WeeklyNewsTemplateData>) => void;
}

// Helper icons
const AddIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>;

export default function SmartFillerWeekly({ isOpen, onClose, onApply }: SmartFillerWeeklyProps) {
    const [weeks, setWeeks] = useState<WeekOption[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
    const [newsItems, setNewsItems] = useState<WeeklyNewsItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    // Assignment State
    const [assignedHero, setAssignedHero] = useState<WeeklyNewsItem | null>(null);
    const [assignedCards, setAssignedCards] = useState<(WeeklyNewsItem | null)[]>([null, null, null]);
    const [assignedList, setAssignedList] = useState<{ item: WeeklyNewsItem, isImportant: boolean }[]>([]);

    useEffect(() => {
        if (isOpen) {
            startTransition(async () => {
                const recentWeeks = await getRecentWeeksAction();
                setWeeks(recentWeeks);
                if (recentWeeks.length > 0) {
                    setSelectedWeek(recentWeeks[0]); // Default to latest
                    // Automatically fetch news for latest week
                    const news = await getNewsForWeekAction(recentWeeks[0].startDate, recentWeeks[0].endDate);
                    setNewsItems(news);
                }
            });
        }
    }, [isOpen]);

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const week = weeks.find(w => w.startDate === e.target.value);
        if (week) {
            setSelectedWeek(week);
            startTransition(async () => {
                const news = await getNewsForWeekAction(week.startDate, week.endDate);
                setNewsItems(news);
                // Assignments persist across week changes now
            });
        }
    };

    const toggleAssignHero = (item: WeeklyNewsItem) => {
        if (assignedHero?._id === item._id) {
            setAssignedHero(null);
        } else {
            setAssignedHero(item);
        }
    };

    const toggleAssignCard = (item: WeeklyNewsItem) => {
        const existingIndex = assignedCards.findIndex(c => c?._id === item._id);
        
        if (existingIndex !== -1) {
            const newCards = [...assignedCards];
            newCards[existingIndex] = null;
            setAssignedCards(newCards);
        } else {
            const emptyIndex = assignedCards.findIndex(c => c === null);
            if (emptyIndex !== -1) {
                const newCards = [...assignedCards];
                newCards[emptyIndex] = item;
                setAssignedCards(newCards);
            } else {
                const newCards = [...assignedCards];
                newCards[2] = item;
                setAssignedCards(newCards);
            }
        }
    };

    const toggleAssignList = (item: WeeklyNewsItem) => {
        const exists = assignedList.some(l => l.item._id === item._id);
        if (exists) {
            setAssignedList(assignedList.filter(l => l.item._id !== item._id));
        } else {
            if (assignedList.length >= 10) return;
            setAssignedList([...assignedList, { item, isImportant: false }]);
        }
    };

    const handleRemoveCard = (index: number) => {
        const newCards = [...assignedCards];
        newCards[index] = null;
        setAssignedCards(newCards);
    };

    const handleRemoveList = (index: number) => {
        setAssignedList(assignedList.filter((_, i) => i !== index));
    };

    const toggleImportant = (index: number) => {
        const newList = [...assignedList];
        newList[index].isImportant = !newList[index].isImportant;
        setAssignedList(newList);
    };

    const handleFinalApply = () => {
        const newData: any = {};
        
        if (selectedWeek) {
            newData.weekNumber = `الأسبوع ${selectedWeek.weekNum}`;
            newData.year = selectedWeek.year.toString();
        }

        if (assignedHero) {
            newData.hero = {
                title: assignedHero.title,
                image: assignedHero.imageUrl || '',
                tag: 'خبر عاجل',
                imageSettings: { x: 0, y: 0, scale: 1 }
            };
        }

        if (assignedCards.some(c => c !== null)) {
             const validCards = assignedCards.map((c, i) => c ? ({
                 id: i + 1,
                 title: c.title,
                 image: c.imageUrl || '',
                 imageSettings: { x: 0, y: 0, scale: 1 }
             }) : null).filter(Boolean);
             
             if (validCards.length > 0) {
                 newData.cards = validCards;
             }
        }

        if (assignedList.length > 0) {
            newData.newsList = assignedList.map((item, i) => ({
                id: i + 5,
                number: (i + 5).toString().padStart(2, '0'),
                text: item.item.title,
                isImportant: item.isImportant
            }));
        }

        onApply(newData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ maxWidth: '95vw', width: '1200px', height: '85vh', display: 'flex', flexDirection: 'column', padding: '0' }}>
            {/* Header */}
            <div style={{ padding: '2rem 2rem 1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-main)' }}>الملء الذكي للنشرة</h3>
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

            {/* Main Content */}
            <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* LEFT: Available News */}
                <div style={{ width: '40%', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>أخبار الأسبوع ({newsItems.length})</div>
                    <div style={{ overflowY: 'auto', flexGrow: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {isPending ? <div className="spinner" style={{ margin: 'auto' }} /> : 
                         newsItems.length === 0 ? <p style={{textAlign:'center', color: 'var(--text-secondary)'}}>لا أخبار في هذه الفترة.</p> :
                         newsItems.map(item => {
                            const isHero = assignedHero?._id === item._id;
                            const isCard = assignedCards.some(c => c?._id === item._id);
                            const isList = assignedList.some(l => l.item._id === item._id);
                            
                            return (
                                <div key={item._id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                        {item.imageUrl && <Image src={item.imageUrl} alt="" width={60} height={40} style={{ borderRadius: '4px', objectFit: 'cover' }} loader={sanityLoader} />}
                                        <div>
                                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: '1.3' }}>{item.title}</p>
                                            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>{new Date(item.publishedAt).toLocaleDateString('ar-EG')}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button 
                                            onClick={() => toggleAssignHero(item)} 
                                            className={isHero ? "primary-button" : "outline-button"} 
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '1.1rem', minWidth: '60px' }}
                                        >
                                            {isHero ? 'Hero ✓' : 'Hero'}
                                        </button>
                                        <button 
                                            onClick={() => toggleAssignCard(item)} 
                                            className={isCard ? "primary-button" : "outline-button"} 
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '1.1rem', minWidth: '60px' }}
                                        >
                                            {isCard ? 'Card ✓' : 'Card'}
                                        </button>
                                        <button 
                                            onClick={() => toggleAssignList(item)} 
                                            className={isList ? "primary-button" : "outline-button"} 
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '1.1rem', minWidth: '60px' }}
                                        >
                                            {isList ? 'List ✓' : 'List'}
                                        </button>
                                    </div>
                                </div>
                            );
                         })}
                    </div>
                </div>

                {/* RIGHT: Assignments */}
                <div style={{ width: '60%', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '2rem', gap: '2rem', backgroundColor: '#050505' }}>
                    
                    {/* Hero Assignment */}
                    <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '1rem', background: '#111' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#00FFF0' }}>الخبر الرئيسي (Hero)</h4>
                        {assignedHero ? (
                             <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                 {assignedHero.imageUrl && <Image src={assignedHero.imageUrl} alt="" width={80} height={45} style={{ borderRadius: '4px', objectFit: 'cover' }} loader={sanityLoader} />}
                                 <div style={{ flexGrow: 1 }}>
                                     <p style={{ margin: 0, fontWeight: 'bold', color: '#fff' }}>{assignedHero.title}</p>
                                 </div>
                                 <button onClick={() => setAssignedHero(null)} style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}><TrashIcon /></button>
                             </div>
                        ) : (
                            <div style={{ border: '1px dashed #444', borderRadius: '4px', padding: '1rem', textAlign: 'center', color: '#666' }}>اختر خبرًا للواجهة</div>
                        )}
                    </div>

                    {/* Cards Assignment */}
                    <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '1rem', background: '#111' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#00FFF0' }}>البطاقات الرئيسية (Cards)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            {assignedCards.map((card, i) => (
                                <div key={i} style={{ border: '1px solid #333', borderRadius: '4px', padding: '0.5rem', minHeight: '80px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '2px', left: '5px', fontSize: '10px', color: '#555' }}>#{i+1}</div>
                                    {card ? (
                                        <>
                                            <p style={{ fontSize: '0.9rem', color: '#fff', margin: '1.5rem 0 0.5rem 0', lineHeight: '1.2', height: '3.6em', overflow: 'hidden' }}>{card.title}</p>
                                            <button onClick={() => handleRemoveCard(i)} style={{ position: 'absolute', top: '2px', right: '2px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}><TrashIcon /></button>
                                        </>
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.8rem' }}>فارغ</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* List Assignment */}
                    <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '1rem', background: '#111', flexGrow: 1 }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#00FFF0' }}>قائمة الأخبار (News List)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {assignedList.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#1A1A1A', padding: '0.5rem', borderRadius: '4px' }}>
                                    <span style={{ color: '#555', fontFamily: 'monospace', width: '20px' }}>{i+1}</span>
                                    <p style={{ margin: 0, color: '#fff', flexGrow: 1, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.item.title}</p>
                                    
                                    <button 
                                        onClick={() => toggleImportant(i)}
                                        title="تمييز كخبر هام"
                                        style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            cursor: 'pointer',
                                            color: item.isImportant ? '#00FFF0' : '#444',
                                            transition: 'color 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        <span style={{fontSize: '11px', fontWeight: 'bold'}}>هام</span>
                                        <CheckIcon />
                                    </button>

                                    <button onClick={() => handleRemoveList(i)} style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}><TrashIcon /></button>
                                </div>
                            ))}
                            {assignedList.length === 0 && <p style={{ color: '#444', textAlign: 'center' }}>لم تتم إضافة أي أخبار للقائمة.</p>}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <div className={modalStyles.modalActions} style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={onClose} className="outline-button">إلغاء</button>
                <button onClick={handleFinalApply} className="primary-button">تطبيق التغييرات</button>
            </div>
        </Modal>
    );
}