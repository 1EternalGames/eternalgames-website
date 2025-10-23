// app/studio/director/EditRolesModal.tsx

'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserRolesAction } from './actions';
import { useToast } from '@/lib/toastStore';
import type { User, Role } from '@prisma/client';
import modalStyles from '@/components/modals/Modals.module.css'; // <-- THE FIX: Import shared modal styles

type UserWithRoles = User & { roles: { name: string }[] };

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 250 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } },
};

export function EditRolesModal({ user, allRoles, onClose, onUpdate }: { user: UserWithRoles, allRoles: Role[], onClose: () => void, onUpdate: (userId: string, newRoles: Role[]) => void }) {
    const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(() => new Set(user.roles.map(r => allRoles.find(ar => ar.name === r.name)!.id)));
    const [isPending, startTransition] = useTransition();
    const toast = useToast();
    const [isMounted, setIsMounted] = useState(false); // <-- THE FIX: State for portal hydration

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const manageableRoles = useMemo(() => allRoles.filter(role => role.name !== 'USER'), [allRoles]);
    const userRoleId = useMemo(() => allRoles.find(role => role.name === 'USER')?.id, [allRoles]);

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(roleId)) {
                newSet.delete(roleId);
            } else {
                newSet.add(roleId);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        startTransition(async () => {
            const finalRoleIds = new Set(selectedRoleIds);
            if (userRoleId) {
                finalRoleIds.add(userRoleId);
            }

            const result = await updateUserRolesAction(user.id, Array.from(finalRoleIds));
            if (result.success && result.updatedRoles) {
                onUpdate(user.id, result.updatedRoles);
                toast.success(`Roles for ${user.name} updated.`);
                onClose();
            } else {
                toast.error(result.message || 'فشل تحديث الأدوار.');
            }
        });
    };

    // --- THE FIX: The entire modal is now structured for portal rendering ---
    const modalContent = (
        <AnimatePresence>
            <motion.div
                className={modalStyles.modalOverlay}
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className={modalStyles.modalContent}
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 style={{ marginTop: 0 }}>Edit Roles for {user.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '-1rem' }}>حدد الأدوار التي يجب أن يمتلكها هذا المستخدم.</p>
                    <div className="roles-checklist" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '1rem', 
                        margin: '2rem 0' 
                    }}>
                        {manageableRoles.map(role => (
                            <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedRoleIds.has(role.id)}
                                    onChange={() => handleRoleToggle(role.id)}
                                    style={{ width: '1.6rem', height: '1.6rem' }}
                                />
                                <span style={{ fontWeight: role.name === 'DIRECTOR' ? 700 : 500, color: role.name === 'DIRECTOR' ? 'gold' : 'inherit' }}>
                                    {role.name}
                                </span>
                            </label>
                        ))}
                    </div>
                    <div className={modalStyles.modalActions}>
                        <button onClick={onClose} className="outline-button" disabled={isPending}>إلغاء</button>
                        <button onClick={handleSave} className="primary-button" disabled={isPending}>
                            {isPending ? 'جار الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    if (!isMounted) {
        return null;
    }

    return createPortal(modalContent, document.body);
}


