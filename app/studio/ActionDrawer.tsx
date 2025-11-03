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
        switch (item._type) {
            case 'review': return { plural: 'reviews', live: `/reviews/${item.slug}` };
            case 'article': return { plural: 'articles', live: `/articles/${item.slug}` };
            case 'news': return { plural: 'news', live: `/news/${item.slug}` };
            case 'gameRelease': return { plural: 'releases', live: `/releases` }; // Game releases have a main page, not individual pages
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

    const actions = [
        { label: 'تحرير', icon: <EditIcon />, href: studioEditUrl, isLink: true },
        { label: 'Preview', icon: <PreviewIcon />, href: livePreviewUrl, isLink: true },
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
                onClick={(e) => e.stopPropagation()}
            >
                <motion.div className={styles.actionDrawerButtons} variants={itemContainerVariants}>
                    {actions.map((action) => (
                        <motion.div key={action.label} variants={itemVariants}>
                            {action.isLink ? (
                                <Link href={action.href!} className={styles.actionDrawerButton} aria-label={action.label} target={action.label === 'Preview' ? '_blank' : '_self'}>
                                    {action.icon}
                                </Link>
                            ) : (
                                <button className={`${styles.actionDrawerButton} ${styles.delete}`} onClick={action.onClick} aria-label={action.label}>
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


