// components/studio/social/monthly-games/SmartFillerMonthly.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';
import { getReleasesForMonthAction, SmartFillRelease } from '@/app/studio/social-templates/monthly-games/actions';
import Image from 'next/image';
import { sanityLoader } from '@/lib/sanity.loader';

interface SmartFillerMonthlyProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (selectedReleases: SmartFillRelease[], monthName: string) => void;
}

const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function SmartFillerMonthly({ isOpen, onClose, onApply }: SmartFillerMonthlyProps) {
    // Default to current month
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
    const [releases, setReleases] = useState<SmartFillRelease[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen && selectedMonth) {
            handleFetch(selectedMonth);
        }
    }, [isOpen]);

    const handleFetch = (dateVal: string) => {
        startTransition(async () => {
            const data = await getReleasesForMonthAction(dateVal);
            setReleases(data);
            // Auto-select first 9 if available
            const preSelect = new Set(data.slice(0, 9).map(r => r._id));
            setSelectedIds(preSelect);
        });
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSelectedMonth(val);
        handleFetch(val);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            if (newSet.size >= 9) return; // Limit to 9
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleApply = () => {
        // Filter releases to maintain original sort order (by date)
        const selectedReleases = releases.filter(r => selectedIds.has(r._id));
        
        // Get Arabic month name
        const [year, month] = selectedMonth.split('-');
        const monthName = `ألعاب ${arabicMonths[parseInt(month) - 1]}`; // e.g. "ألعاب نوفمبر"

        onApply(selectedReleases, monthName);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ maxWidth: '700px', width: '100%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontFamily: 'var(--font-main)' }}>الملء الذكي للإصدارات</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem', marginBottom: '2rem' }}>
                اختر الشهر وحدد حتى 9 ألعاب لملء القالب تلقائيًا.
            </p>

            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={handleMonthChange} 
                    className="profile-input" 
                    style={{ maxWidth: '200px' }}
                />
                {isPending && <span className="spinner" style={{ width: '20px', height: '20px' }}></span>}
            </div>

            <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: '1rem',
                padding: '0.5rem'
            }}>
                {releases.length === 0 && !isPending && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>لا توجد إصدارات مسجلة لهذا الشهر.</p>
                )}

                {releases.map(release => {
                    const isSelected = selectedIds.has(release._id);
                    const isFull = selectedIds.size >= 9 && !isSelected;
                    
                    return (
                        <div 
                            key={release._id}
                            onClick={() => !isFull && toggleSelection(release._id)}
                            style={{
                                position: 'relative',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                                cursor: isFull ? 'not-allowed' : 'pointer',
                                opacity: isFull ? 0.5 : 1,
                                transition: 'all 0.2s ease',
                                aspectRatio: '3/4'
                            }}
                        >
                            {release.imageUrl ? (
                                <Image 
                                    loader={sanityLoader} 
                                    src={release.imageUrl} 
                                    alt={release.title} 
                                    fill 
                                    style={{ objectFit: 'cover' }}
                                    sizes="150px"
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#111' }} />
                            )}
                            
                            <div style={{
                                position: 'absolute',
                                bottom: 0, left: 0, right: 0,
                                background: 'rgba(0,0,0,0.8)',
                                padding: '0.5rem',
                                fontSize: '1.1rem',
                                color: '#fff',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{release.title}</div>
                                <div style={{ fontSize: '1rem', color: 'var(--accent)' }}>{release.releaseDate.split('-')[2]}</div>
                            </div>

                            {isSelected && (
                                <div style={{
                                    position: 'absolute', top: '5px', right: '5px',
                                    background: 'var(--accent)', borderRadius: '50%',
                                    width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className={modalStyles.modalActions} style={{ marginTop: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: selectedIds.size === 9 ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                    تم تحديد {selectedIds.size} / 9
                </span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onClose} className="outline-button">إلغاء</button>
                    <button onClick={handleApply} className="primary-button" disabled={selectedIds.size === 0}>
                        تطبيق ({selectedIds.size})
                    </button>
                </div>
            </div>
        </Modal>
    );
}


