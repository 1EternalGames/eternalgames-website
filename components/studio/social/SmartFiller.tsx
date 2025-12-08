'use client';

import { useState, useTransition, useEffect } from 'react';
import { searchContentForTemplateAction } from '@/app/studio/social-templates/actions';
import Modal from '@/components/modals/Modal';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './SocialEditor.module.css';
import Image from 'next/image';

interface SmartFillerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: any) => void;
}

export default function SmartFiller({ isOpen, onClose, onSelect }: SmartFillerProps) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);
    const [results, setResults] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();

    // Combined effect: Fetches initially (empty query) and on search change
    useEffect(() => {
        if (!isOpen) return;

        startTransition(async () => {
            const data = await searchContentForTemplateAction(debouncedQuery);
            setResults(data);
        });
    }, [debouncedQuery, isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ maxWidth: '600px', width: '100%' }}>
            {/* REMOVED (Smart Fill) English text as requested */}
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-main)', fontSize: '2rem' }}>الملء الذكي</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                اختر محتوى لملء القالب تلقائيًا. يتم عرض الأحدث افتراضيًا.
            </p>
            
            <input 
                type="search" 
                placeholder="ابحث بالعنوان أو المحتوى..." 
                className="profile-input" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {isPending ? (
                    <div className="spinner" style={{ margin: '2rem auto' }} />
                ) : (
                    <>
                        {results.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>لا نتائج.</p>
                        )}
                        {results.map((item) => (
                            <div key={item._id} className={styles.searchResultItem} onClick={() => { onSelect(item); onClose(); }}>
                                {item.imageUrl && (
                                    <Image src={item.imageUrl} alt={item.title} width={50} height={50} className={styles.searchResultImg} />
                                )}
                                <div className={styles.searchResultInfo}>
                                    <h4>{item.title}</h4>
                                    <p>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ar-EG') : 'مسودة'}</p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </Modal>
    );
}