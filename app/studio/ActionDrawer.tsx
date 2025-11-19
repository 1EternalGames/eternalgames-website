// app/studio/ActionDrawer.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { EditIcon, PreviewIcon, DeleteIcon } from './StudioIcons';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import styles from './ActionDrawer.module.css';

type ContentCanvasItem = { _id: string; _type: string; slug: string; title: string; };

const drawerVariants = {
    hidden: { y: '100%' },
    visible: { y: '0%', transition: { type: 'spring' as const, damping: 25, stiffness: 200 } },
    exit: { y: '100%', transition: { duration: 0.2 } }
};

const itemContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

export function ActionDrawer({ item, onDelete }: { item: ContentCanvasItem, onDelete: (id: string) => Promise<void> }) {
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    const getPaths = () => {
        // Use item.slug if available, otherwise fallback to empty string to prevent URL errors
        const safeSlug = item.slug || '';
        switch (item._type) {
            case 'review': return { plural: 'reviews', live: `/reviews/${safeSlug}` };
            case 'article': return { plural: 'articles', live: `/articles/${safeSlug}` };
            case 'news': return { plural: 'news', live: `/news/${safeSlug}` };
            case 'gameRelease': return { plural: 'releases', live: `/releases` };
            default: return { plural: '', live: '/' };
        }
    };

    const { plural, live } = getPaths();
    const studioEditUrl = `/studio/${plural}/${item._id}`;
    const livePreviewUrl = live;

    const handleDeleteConfirm = async () => {
        await onDelete(item._id);
        setDeleteModalOpen(false);
    };

    // Explicit type handling for actions
    type ActionItem = {
        label: string;
        icon: React.ReactNode;
        href?: string;
        onClick?: () => void;
        isLink: boolean;
    };

    const actions: ActionItem[] = [
        { label: 'تحرير', icon: <EditIcon />, href: studioEditUrl, isLink: true },
        { label: 'معاينة', icon: <PreviewIcon />, href: livePreviewUrl, isLink: true },
        { label: 'حذف', icon: <DeleteIcon />, onClick: () => setDeleteModalOpen(true), isLink: false },
    ];

    return (
        <>
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={item.title}
            />
            <motion.div
                className={styles.actionDrawerContainer}
                variants={drawerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                // Important: Stop propagation on click/hover to prevent bubbling to card
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => e.stopPropagation()}
            >
                <motion.div className={styles.actionDrawerButtons} variants={itemContainerVariants}>
                    {actions.map((action) => (
                        <motion.div key={action.label} variants={itemVariants}>
                            {action.isLink ? (
                                <Link 
                                    href={action.href!} 
                                    className={styles.actionDrawerButton} 
                                    aria-label={action.label} 
                                    target={action.label === 'معاينة' ? '_blank' : '_self'}
                                    prefetch={false} // Disable prefetch to reduce load
                                    onClick={(e) => e.stopPropagation()} // Extra safety
                                >
                                    {action.icon}
                                </Link>
                            ) : (
                                <button 
                                    className={`${styles.actionDrawerButton} ${styles.delete}`} 
                                    onClick={(e) => { e.stopPropagation(); action.onClick?.(); }} 
                                    aria-label={action.label}
                                >
                                    {action.icon}
                                </button>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </>
    );
}