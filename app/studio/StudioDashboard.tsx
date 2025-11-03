// app/studio/StudioDashboard.tsx

'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioTabs, ContentType } from './StudioTabs';
import { ActionDrawer } from './ActionDrawer';
import { GenesisOrb } from './GenesisOrb';
import { deleteDocumentAction } from './actions';
import { useToast } from '@/lib/toastStore';
import { urlFor } from '@/sanity/lib/image';
import Image from 'next/image';
import { sanityLoader } from '@/lib/sanity.loader';

type ContentStatus = 'all' | 'draft' | 'published' | 'scheduled';
type ContentCanvasItem = { _id: string; _type: 'review' | 'article' | 'news' | 'gameRelease'; _updatedAt: string; title: string; slug: string; status: ContentStatus; mainImage?: any; blurDataURL?: string; };

const ContentCanvas = ({ item, onDelete }: { item: ContentCanvasItem; onDelete: (id: string) => Promise<void>; }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const isDrawerVisible = isHovered || isClicked;
    const imageUrlWithBuster = useMemo(() => {
        if (!item.mainImage?.asset) return null;
        const url = urlFor(item.mainImage).width(800).height(500).fit('crop').auto('format').url();
        return `${url}&buster=${new Date(item._updatedAt).getTime()}`;
    }, [item.mainImage, item._updatedAt]);

    return (
        <motion.div layoutId={`canvas-card-${item._id}`} style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16 / 10', cursor: 'pointer' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={() => setIsClicked(prev => !prev)} >
            <motion.div className="canvas-image-container" animate={{ scale: isDrawerVisible ? 1.05 : 1, filter: isDrawerVisible ? 'brightness(0.8)' : 'brightness(1)' }} transition={{ type: 'spring' as const, damping: 20, stiffness: 150 }} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                {imageUrlWithBuster ? (
                    <Image 
                        src={imageUrlWithBuster} 
                        alt={item.title} 
                        fill
                        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 350px"
                        style={{ objectFit: 'cover' }}
                        loader={sanityLoader}
                    />
                ) : (<span style={{color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 600}}>NO IMAGE</span>)}
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
    const toast = useToast();
    const [isPending, startTransition] = useTransition();

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

    return (
        <div className="container page-container">
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="page-title">ديوان القيادة</h1>
                <p className="sidebar-subtitle" style={{ fontSize: '1.8rem' }}>قُد دفّة محتواك في رحاب EternalGames.</p>
            </header>

            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '3rem'}}>
                <input type="search" placeholder="ابحث في العناوين..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{width: '100%', maxWidth: '500px'}} className="profile-input" />
            </div>

            {shouldShowTabs && (
                <StudioTabs tabs={availableTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            )}

            <motion.div layout className="content-grid" style={{gap: '1.5rem'}}>
                <AnimatePresence>
                    {filteredContent.map(item => (
                        <motion.div key={item._id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring' as const, damping: 20, stiffness: 200 }} >
                            <ContentCanvas item={item} onDelete={handleDelete} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
            {filteredContent.length === 0 && <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)'}}>لا يوجد محتوى.</p>}

            <GenesisOrb />
        </div>
    );
}


