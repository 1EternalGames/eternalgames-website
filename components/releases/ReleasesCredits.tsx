// components/releases/ReleasesCredits.tsx
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PenEdit02Icon } from '@/components/icons/index';
import { updateReleasesCreditsAction, getAllStaffAction } from '@/app/actions/homepageActions';
import { useToast } from '@/lib/toastStore';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';
import styles from './ReleasesCredits.module.css';
import { sanityLoader } from '@/lib/sanity.loader';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import KineticLink from '@/components/kinetic/KineticLink'; // IMPORT

type Creator = {
    _id: string;
    name: string;
    username?: string;
    image?: any;
};

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

export default function ReleasesCredits({ initialCredits }: { initialCredits: Creator[] }) {
    const { data: session } = useSession();
    const userRoles = (session?.user as any)?.roles || [];
    const canEdit = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [credits, setCredits] = useState<Creator[]>(initialCredits || []);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [allStaff, setAllStaff] = useState<Creator[]>([]);
    const [hasFetchedStaff, setHasFetchedStaff] = useState(false);
    
    const [isSaving, startSave] = useTransition();
    const [isFetching, startFetch] = useTransition();
    const toast = useToast();

    useEffect(() => {
        if (isModalOpen && !hasFetchedStaff) {
            startFetch(async () => {
                const staff = await getAllStaffAction();
                setAllStaff(staff);
                setHasFetchedStaff(true);
            });
        }
    }, [isModalOpen, hasFetchedStaff]);

    const filteredStaff = useMemo(() => {
        if (!searchQuery) return allStaff;
        const lowerQ = searchQuery.toLowerCase();
        return allStaff.filter(s => s.name.toLowerCase().includes(lowerQ));
    }, [allStaff, searchQuery]);

    const handleAddCreator = (creator: Creator) => {
        if (!credits.find(c => c._id === creator._id)) {
            setCredits([...credits, creator]);
        }
        setSearchQuery('');
    };

    const handleRemoveCreator = (id: string) => {
        setCredits(credits.filter(c => c._id !== id));
    };

    const handleSave = () => {
        startSave(async () => {
            const ids = credits.map(c => c._id);
            const result = await updateReleasesCreditsAction(ids);
            if (result.success) {
                toast.success(result.message);
                setIsModalOpen(false);
            } else {
                toast.error(result.message);
            }
        });
    };
    
    if (credits.length === 0 && !canEdit) return null;

    return (
        <>
            <motion.div 
                className={styles.creditsContainer}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className={styles.creditsCapsule}>
                    <div className={styles.capsuleIcon}>
                        <PenEdit02Icon style={{ width: 14, height: 14 }} />
                    </div>
                    
                    <div className={styles.namesWrapper}>
                        <span className={styles.label}>إعداد:</span>
                        {credits.map((creator, index) => {
                            const profileLink = creator.username ? `/creators/${creator.username}` : null;
                            const creatorData = { name: creator.name, image: creator.image };

                            return (
                                <span key={creator._id} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {index > 0 && <span className={styles.separator}>،</span>}
                                    {profileLink ? (
                                        <KineticLink 
                                            href={profileLink} 
                                            slug={creator.username!}
                                            type="creators"
                                            className={`${styles.creatorLink} no-underline`} 
                                            onClick={(e) => e.stopPropagation()} 
                                            // PASS DATA
                                            preloadedData={creatorData}
                                        >
                                            {creator.name}
                                        </KineticLink>
                                    ) : (
                                        <span className={styles.creatorName}>{creator.name}</span>
                                    )}
                                </span>
                            );
                        })}
                        {credits.length === 0 && <span className={styles.separator}>--</span>}
                    </div>
                </div>

                {canEdit && (
                    <button onClick={() => setIsModalOpen(true)} className={styles.editButton} title="تعديل القائمة">
                        <EditIcon />
                    </button>
                )}
            </motion.div>

            <AnimatePresence>
                {isModalOpen && (
                    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} style={{ maxWidth: '500px' }}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>إدارة فريق التحرير</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>اختر الأعضاء المسؤولين عن هذا القسم.</p>
                        </div>

                        <div className={styles.selectedList}>
                            {credits.map(c => (
                                <div key={c._id} className={styles.selectedChip}>
                                    <span>{c.name}</span>
                                    <button onClick={() => handleRemoveCreator(c._id)} className={styles.removeBtn}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ))}
                            {credits.length === 0 && <p style={{color:'#666', fontSize:'1.2rem', margin:'auto'}}>القائمة فارغة.</p>}
                        </div>

                        <div className={styles.searchContainer}>
                            <input 
                                type="text" 
                                placeholder="ابحث عن عضو..." 
                                className="profile-input" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className={styles.resultsList}>
                            {isFetching ? (
                                <div className="spinner" style={{margin:'1rem auto', width:'20px', height:'20px'}} />
                            ) : (
                                filteredStaff.map(user => {
                                    const isSelected = credits.some(c => c._id === user._id);
                                    if (isSelected) return null;
                                    
                                    const imgUrl = user.image 
                                        ? urlFor(user.image).width(48).height(48).fit('crop').url() 
                                        : '/default-avatar.svg';

                                    return (
                                        <div key={user._id} className={styles.resultItem} onClick={() => handleAddCreator(user)}>
                                            <div className={styles.resultUser}>
                                                <Image 
                                                    loader={sanityLoader}
                                                    src={imgUrl} 
                                                    alt={user.name} 
                                                    width={24} height={24} 
                                                    style={{borderRadius:'50%', objectFit:'cover'}} 
                                                />
                                                <span>{user.name}</span>
                                            </div>
                                            <span className={styles.addLabel}>+</span>
                                        </div>
                                    );
                                })
                            )}
                            {!isFetching && filteredStaff.length === 0 && (
                                <p style={{textAlign:'center', color:'#666', marginTop:'1rem'}}>لا نتائج.</p>
                            )}
                        </div>

                        <div className={modalStyles.modalActions} style={{ marginTop: '2rem' }}>
                            <button onClick={() => setIsModalOpen(false)} className="outline-button">إلغاء</button>
                            <button onClick={handleSave} className="primary-button" disabled={isSaving}>
                                {isSaving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </>
    );
}