// app/studio/StudioDashboard.tsx

'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioTabs, ContentType } from './StudioTabs';
import { ActionDrawer } from './ActionDrawer';
import { GenesisOrb } from './GenesisOrb';
import { deleteDocumentAction } from './actions';
import { useToast } from '@/lib/toastStore';
import { urlFor } from '@/sanity/lib/image';
import Image from 'next/image';
import { sanityLoader } from '@/lib/sanity.loader';
import styles from './StudioDashboard.module.css';
// THE FIX: Import useSession to force cookie sync
import { useSession } from 'next-auth/react';

type ContentStatus = 'all' | 'draft' | 'published' | 'scheduled';
type ContentCanvasItem = { _id: string; _type: 'review' | 'article' | 'news' | 'gameRelease'; _updatedAt: string; title: string; slug: string; status: ContentStatus; mainImage?: any; blurDataURL?: string; };

const ContentCanvas = ({ item, onDelete, isActive, onCardClick, isTouchDevice }: {
    item: ContentCanvasItem;
    onDelete: (id: string) => Promise<void>;
    isActive: boolean;
    onCardClick: () => void;
    isTouchDevice: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const justClickedToClose = useRef(false);

    const handleClick = () => {
        if (isActive) {
            justClickedToClose.current = true;
            setIsHovered(false);
        }
        onCardClick();
    };

    const handleMouseEnter = () => {
        if (isTouchDevice || justClickedToClose.current) {
            return;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        justClickedToClose.current = false;
        setIsHovered(false);
    };

    const isDrawerVisible = isActive || (!isTouchDevice && isHovered);

    const imageUrlWithBuster = useMemo(() => {
        if (!item.mainImage?.asset) return null;
        const url = urlFor(item.mainImage).width(800).height(500).fit('crop').auto('format').url();
        return `${url}&buster=${new Date(item._updatedAt).getTime()}`;
    }, [item.mainImage, item._updatedAt]);

    return (
        <motion.div
            layoutId={`canvas-card-${item._id}`}
            style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16 / 10', cursor: 'pointer' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <motion.div
                className="canvas-image-container"
                animate={{ scale: isDrawerVisible ? 1.05 : 1, filter: isDrawerVisible ? 'brightness(0.8)' : 'brightness(1)' }}
                transition={{ type: 'spring' as const, damping: 20, stiffness: 150 }}
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {imageUrlWithBuster ? (
                    <Image 
                        src={imageUrlWithBuster} 
                        alt={item.title} 
                        fill
                        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 350px"
                        style={{ objectFit: 'cover' }}
                        loader={sanityLoader}
                    />
                ) : (<span style={{color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 600}}>بلا صورة</span>)}
            </motion.div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '1.25rem', color: 'white', pointerEvents: 'none' }}>
                <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '9999px', backgroundColor: item.status === 'published' ? 'rgba(22, 163, 74, 0.8)' : 'rgba(107, 114, 128, 0.8)' }}>{item.status === 'draft' ? 'مسودة' : item.status === 'published' ? 'منشورة' : 'مجدولة'}</span>
                <h3 style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{item.title}</h3>
            </div>
            <AnimatePresence>{isDrawerVisible && <ActionDrawer item={item} onDelete={onDelete} />}</AnimatePresence>
        </motion.div>
    );
};

export function StudioDashboard({ initialContent, userRoles }: { initialContent: ContentCanvasItem[], userRoles: string[] }) {
    const [content, setContent] = useState(initialContent);
    const [activeTab, setActiveTab] = useState<ContentType>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const toast = useToast();
    const [isPending, startTransition] = useTransition();
    
    // THE FIX: Automatically sync session if server roles differ from client roles
    const { data: session, update: updateSession } = useSession();
    useEffect(() => {
        const clientRoles = (session?.user as any)?.roles || [];
        // Simple check: if server has roles and client has none, or lengths differ
        // A deep comparison would be better, but this catches the "User vs Admin" case quickly.
        if (userRoles.length > 0 && JSON.stringify(userRoles.sort()) !== JSON.stringify(clientRoles.sort())) {
            console.log("Syncing session roles with server...");
            updateSession(); 
        }
    }, [userRoles, session, updateSession]);

    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    const availableTabs = useMemo(() => {
        const tabs: { label: string; value: ContentType }[] = [];
        const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
        
        if (isAdminOrDirector || userRoles.includes('REVIEWER')) tabs.push({ label: 'المراجعات', value: 'review' });
        if (isAdminOrDirector || userRoles.includes('AUTHOR')) tabs.push({ label: 'المقالات', value: 'article' });
        if (isAdminOrDirector || userRoles.includes('REPORTER')) tabs.push({ label: 'الأخبار', value: 'news' });
        if (isAdminOrDirector) tabs.push({ label: 'الإصدارات', value: 'gameRelease' });
        
        return tabs;
    }, [userRoles]);
    
    useEffect(() => {
        if (availableTabs.length === 1 && activeTab === 'all') {
            setActiveTab(availableTabs[0].value);
        }
    }, [availableTabs, activeTab]);

    const shouldShowTabs = availableTabs.length > 1;

    const filteredContent = useMemo(() => {
        let filtered = content;
        if (activeTab !== 'all' && shouldShowTabs) {
            filtered = filtered.filter(item => item._type === activeTab);
        } else if (!shouldShowTabs && availableTabs.length === 1) {
            filtered = content.filter(item => item._type === availableTabs[0].value);
        }

        if (searchTerm) {
            filtered = filtered.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return filtered;
    }, [activeTab, content, searchTerm, shouldShowTabs, availableTabs]);
    
    const handleDelete = async (docId: string) => {
        startTransition(async () => {
            const originalContent = content;
            setContent(prev => prev.filter(item => item._id !== docId));
            const result = await deleteDocumentAction(docId);
            if (!result.success) {
                toast.error(result.message || 'فشل الحذف.');
                setContent(originalContent);
            } else {
                toast.success('تم حذف المستند.');
            }
        });
    };
    
    const handleCardClick = (cardId: string) => {
        setActiveCardId(prevId => (prevId === cardId ? null : cardId));
    };

    return (
        <>
            <header className={styles.studioHeader}>
                <h1 className={`${styles.studioTitle} page-title`}>ديوان الصنعة</h1>
                <p className={styles.studioSubtitle}>قُد دفّة محتواك في رحاب EternalGames.</p>
            </header>

            <div className={styles.searchWrapper}>
                <input type="search" placeholder="استنطق المحفوظات..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${styles.searchInput} profile-input`} />
            </div>

            {shouldShowTabs && (
                <StudioTabs tabs={availableTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            )}

            <motion.div layout className="content-grid" style={{gap: '1.5rem'}}>
                <AnimatePresence>
                    {filteredContent.map(item => (
                        <motion.div key={item._id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring' as const, damping: 20, stiffness: 200 }} >
                            <ContentCanvas
                                item={item}
                                onDelete={handleDelete}
                                isActive={activeCardId === item._id}
                                onCardClick={() => handleCardClick(item._id)}
                                isTouchDevice={isTouchDevice}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
            {filteredContent.length === 0 && <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}}>لا محتوى.</p>}

            {/* THE FIX: Pass userRoles prop down */}
            <GenesisOrb userRoles={userRoles} />
        </>
    );
}