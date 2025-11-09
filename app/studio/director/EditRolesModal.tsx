// app/studio/director/EditRolesModal.tsx
'use client';

import { useState, useTransition, useMemo } from 'react';
import { updateUserRolesAction } from './actions';
import { useToast } from '@/lib/toastStore';
import type { User, Role } from '@prisma/client';
import Modal from '@/components/modals/Modal'; // <-- THE FIX: Import generic modal
import modalStyles from '@/components/modals/Modals.module.css';

type UserWithRoles = User & { roles: { name: string }[] };

export function EditRolesModal({ user, allRoles, onClose, onUpdate }: { user: UserWithRoles, allRoles: Role[], onClose: () => void, onUpdate: (userId: string, newRoles: Role[]) => void }) {
    const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(() => new Set(user.roles.map(r => allRoles.find(ar => ar.name === r.name)!.id)));
    const [isPending, startTransition] = useTransition();
    const toast = useToast();
    
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
                toast.success(`أدوار ${user.name} حُدِّثت.`);
                onClose();
            } else {
                toast.error(result.message || 'أخفق تحديث الأدوار.');
            }
        });
    };

    return (
        <Modal isOpen={!!user} onClose={onClose}>
            <h3 style={{ marginTop: 0 }}>تعديل أدوار {user.name}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '-1rem' }}>اختر الأدوار التي سيتقلَّدها هذا المستخدم.</p>
            <div className="roles-checklist" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                margin: '2rem 0' 
            }}>
                {manageableRoles.map(role => (
                    <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-main)' }}>
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
        </Modal>
    );
}


