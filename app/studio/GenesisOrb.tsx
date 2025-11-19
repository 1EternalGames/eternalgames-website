// app/studio/GenesisOrb.tsx
'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
// REMOVED: useSession import is no longer the primary source of truth
import { createDraftAction } from './actions';
import { ReviewIcon, ArticleIcon, NewsIcon, ReleaseIcon } from '@/components/icons/index';
import { useToast } from '@/lib/toastStore';
import styles from './GenesisOrb.module.css';

// THE FIX: Modified viewBox and paths to ensure perfect center alignment of the '+' sign.
const PlusIcon = () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"> <line x1="12" y1="5" x2="12" y2="19"></line> <line x1="5" y1="12" x2="19" y2="12"></line> </svg> );

const allContentTypes = [
    { type: 'review' as const, label: 'مراجعة جديدة', icon: <ReviewIcon />, requiredRole: 'REVIEWER' },
    { type: 'article' as const, label: 'مقالة جديدة', icon: <ArticleIcon />, requiredRole: 'AUTHOR' },
    { type: 'news' as const, label: 'خبر جديد', icon: <NewsIcon />, requiredRole: 'REPORTER' },
    { type: 'gameRelease' as const, label: 'إصدار جديد', icon: <ReleaseIcon />, requiredRole: 'ADMIN' }, // Restricted
];

const orbContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }, };
const satelliteVariants = { hidden: { scale: 0, opacity: 0, x: 0, y: 0 }, visible: (custom: { x: number; y: number }) => ({ scale: 1, opacity: 1, x: custom.x, y: custom.y, transition: { type: 'spring' as const, stiffness: 400, damping: 18 }, }), };
const backdropVariants = { hidden: { scale: 0, opacity: 0, transition: { duration: 0.2, ease: "easeOut" as const } }, visible: { scale: 1, opacity: 1, transition: { type: "spring" as const, stiffness: 400, damping: 25 } }, };

// THE FIX: Accept userRoles as a prop
export function GenesisOrb({ userRoles }: { userRoles: string[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const toast = useToast();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
    
    const creationPermissions = useMemo(() => new Set( allContentTypes.filter(item => isAdminOrDirector || userRoles.includes(item.requiredRole)).map(item => item.type) ), [isAdminOrDirector, userRoles]);

    const handleCreate = (contentType: 'review' | 'article' | 'news' | 'gameRelease') => {
        if (isPending) return;
        if (!creationPermissions.has(contentType)) { toast.error("ليس لكَ إذنُ الإنشاء.", "left"); return; }
        setIsOpen(false);
        startTransition(async () => {
            try {
                const newDraft = await createDraftAction(contentType);
                const contentTypePlural = newDraft._type === 'news' ? 'news' : (newDraft._type === 'gameRelease' ? 'releases' : `${newDraft._type}s`);
                const route = contentType === 'gameRelease' ? `/studio/releases/${newDraft._id}` : `/studio/${contentTypePlural}/${newDraft._id}`;
                router.push(route);
            } catch (error: any) {
                toast.error(error.message || "أخفق إنشاء المسودة.", "left");
            }
        });
    };
    
    if (creationPermissions.size === 0 && !isAdminOrDirector) { return null; }

    const availableTypes = allContentTypes.filter(item => creationPermissions.has(item.type));
    const radius = isMobile ? 85 : 100;

    return (
        <div className={styles.genesisContainer}>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: '-110px', right: '-110px', width: '300px', height: '300px', backgroundColor: 'transparent', borderRadius: '50%', zIndex: 10, cursor: 'default' }} />
                        <motion.div className={styles.genesisSatellites} variants={orbContainerVariants} initial="hidden" animate="visible" exit="hidden" >
                            {availableTypes.map((item, i) => {
                                const totalAngle = 110;
                                const startAngle = 170;
                                const angleInDegrees = startAngle + (i * (totalAngle / (availableTypes.length -1 || 1) ));
                                const angleInRadians = angleInDegrees * (Math.PI / 180);
                                const x = Math.cos(angleInRadians) * radius;
                                const y = Math.sin(angleInRadians) * radius;

                                return (
                                    <motion.div key={item.type} className={styles.satelliteWrapper} custom={{ x, y }} variants={satelliteVariants} >
                                        <button className={styles.satelliteOrb} onClick={() => handleCreate(item.type)} disabled={isPending} title={item.label}>
                                            {item.icon}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <motion.button onClick={() => setIsOpen(!isOpen)} disabled={isPending} className={styles.genesisOrb} whileHover={{ scale: 1.05, boxShadow: isOpen ? '0 0 35px 0 #DC2626' : '0 0 35px 0 var(--accent)' }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }} animate={{ scale: isOpen ? 1.1 : 1, backgroundColor: isOpen ? '#DC2626' : 'var(--accent)', boxShadow: isOpen ? '0 0 35px 0 #DC2626' : '0 0 35px 0 var(--accent)' }} >
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }} className={isOpen ? styles.closeIcon : ''}>
                    <PlusIcon />
                </motion.div>
            </motion.button>
        </div>
    );
}