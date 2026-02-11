// app/studio/director/UserManagementClient.tsx
'use client';

import { useState, useMemo, useTransition, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { EditRolesModal } from './EditRolesModal';
import type { User, Role } from '@/lib/generated/client';
import { translateRole } from '@/lib/translations';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';
import { toggleUserBanAction } from '@/app/actions/banActions';
import { searchUsersAction } from './actions';
import { useToast } from '@/lib/toastStore';
import { useDebounce } from '@/hooks/useDebounce';
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel';

type UserWithRoles = User & { roles: { name: string }[] };

// ... (BanModal, UnbanModal, UserRow components remain defined here as in previous iteration)
const BanModal = ({ user, onClose, onConfirm }: { user: UserWithRoles, onClose: () => void, onConfirm: (reason: string) => void }) => {
    const [reason, setReason] = useState('');
    return (
        <Modal isOpen={!!user} onClose={onClose}>
            <h3 style={{ marginTop: 0, color: '#DC2626' }}>حظر المستخدم: {user.name}</h3>
            <div style={{ margin: '2rem 0' }}>
                <textarea className="profile-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الحظر..." />
            </div>
            <div className={modalStyles.modalActions}>
                <button onClick={onClose} className="outline-button">إلغاء</button>
                <button onClick={() => onConfirm(reason)} className="primary-button delete-forever" disabled={!reason.trim()}>تأكيد الحظر</button>
            </div>
        </Modal>
    );
};

const UnbanModal = ({ user, onClose, onConfirm }: { user: UserWithRoles, onClose: () => void, onConfirm: () => void }) => (
    <Modal isOpen={!!user} onClose={onClose}>
        <h3 style={{ marginTop: 0 }}>رفع الحظر عن {user.name}</h3>
        <div className={modalStyles.modalActions}>
            <button onClick={onClose} className="outline-button">إلغاء</button>
            <button onClick={onConfirm} className="primary-button">تأكيد</button>
        </div>
    </Modal>
);

const UserRow = ({ user, onEdit, onBanClick }: any) => {
    const displayString = user.roles.filter((r: any) => r.name !== 'USER').map((r: any) => translateRole(r.name)).join('، ') || 'عضو';
    return (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`user-row ${user.isBanned ? 'banned' : ''}`}>
            <div className="user-info">
                <Image src={user.image || '/default-avatar.svg'} alt="" width={40} height={40} className="user-avatar" style={{ filter: user.isBanned ? 'grayscale(1)' : 'none' }} />
                <div>
                    <p className="user-name" style={{ color: user.isBanned ? '#DC2626' : 'inherit' }}>{user.name}</p>
                    <p className="user-email">{user.email}</p>
                </div>
            </div>
            <div className="user-roles"><span className="roles-badge">{displayString}</span></div>
            <div className="user-actions">
                <button className="outline-button" onClick={() => onEdit(user)}>الرتب</button>
                <button className="outline-button" onClick={() => onBanClick(user)} style={{ color: user.isBanned ? 'var(--text-secondary)' : '#DC2626', borderColor: user.isBanned ? 'var(--border-color)' : '#DC2626' }}>
                    {user.isBanned ? 'رفع الحظر' : 'حظر'}
                </button>
            </div>
        </motion.div>
    );
};

export function UserManagementClient({ initialUsers, allRoles }: { initialUsers: UserWithRoles[], allRoles: Role[] }) {
    const [users, setUsers] = useState<UserWithRoles[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [hasMore, setHasMore] = useState(initialUsers.length === 100);
    const [isLoading, setIsLoading] = useState(false);
    
    // Modals
    const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
    const [userToBan, setUserToBan] = useState<UserWithRoles | null>(null);
    const [userToUnban, setUserToUnban] = useState<UserWithRoles | null>(null);
    
    const [isPending, startTransition] = useTransition();
    const toast = useToast();

    useEffect(() => {
        if (debouncedSearch === '') return;
        setIsLoading(true);
        searchUsersAction(debouncedSearch, 0, 100).then(newUsers => {
            setUsers(newUsers as any);
            setHasMore(newUsers.length === 100);
            setIsLoading(false);
        });
    }, [debouncedSearch]);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        const offset = users.length;
        const newUsers = await searchUsersAction(debouncedSearch, offset, 100);
        
        if (newUsers.length < 100) setHasMore(false);
        setUsers(prev => [...prev, ...newUsers as any]);
        setIsLoading(false);
    }, [users.length, hasMore, isLoading, debouncedSearch]);

    const handleUpdateRoles = (userId: string, newRoles: Role[]) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: newRoles.map(r => ({ name: r.name })) } : u));
    };

    const handleBanToggle = (userId: string, isBanned: boolean, reason: string | null) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned, banReason: reason } : u));
    };

    return (
        <div className="user-management-container">
            <style jsx>{`
                .user-management-container { max-width: 960px; margin: 0 auto; }
                .search-input { width: 100%; margin-bottom: 2rem; }
                .user-list-header, .user-row { display: grid; grid-template-columns: 2fr 1.5fr 1fr; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-color); }
                .user-row.banned { background-color: rgba(220, 38, 38, 0.05); }
                .user-list-header { font-weight: 600; color: var(--text-secondary); }
                .user-info { display: flex; align-items: center; gap: 1rem; }
                .user-name { font-weight: 600; margin: 0; }
                .user-email { font-size: 1.4rem; color: var(--text-secondary); margin: 0; overflow: hidden; text-overflow: ellipsis; }
                .roles-badge { background-color: var(--bg-secondary); padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 1.3rem; border: 1px solid var(--border-color); }
                .user-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
                @media (max-width: 768px) { .user-list-header { display: none; } .user-row { grid-template-columns: 1fr; gap: 1rem; } .user-actions { justify-content: flex-start; } }
            `}</style>

            <input type="search" placeholder="ابحث بالاسم أو البريد..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="profile-input search-input" />
            
            <div className="user-list">
                <div className="user-list-header"><span>العضو</span><span>الرتب</span><span>الإجراءات</span></div>
                {users.map(user => (
                    <UserRow key={user.id} user={user} onEdit={setSelectedUser} onBanClick={(u: any) => u.isBanned ? setUserToUnban(u) : setUserToBan(u)} />
                ))}
            </div>

            {hasMore && <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', padding: '2rem' }}><InfiniteScrollSentinel onIntersect={loadMore} />{isLoading && <div className="spinner" />}</div>}

            <AnimatePresence>
                {selectedUser && <EditRolesModal user={selectedUser} allRoles={allRoles} onClose={() => setSelectedUser(null)} onUpdate={handleUpdateRoles} />}
                {userToBan && <BanModal user={userToBan} onClose={() => setUserToBan(null)} onConfirm={(reason) => { startTransition(async () => { const res = await toggleUserBanAction(userToBan.id, reason, true); if(res.success) { handleBanToggle(userToBan.id, true, reason); toast.success('تم الحظر'); } else { toast.error(res.message); } setUserToBan(null); }); }} />}
                {userToUnban && <UnbanModal user={userToUnban} onClose={() => setUserToUnban(null)} onConfirm={() => { startTransition(async () => { const res = await toggleUserBanAction(userToUnban.id, '', false); if(res.success) { handleBanToggle(userToUnban.id, false, null); toast.success('تم رفع الحظر'); } else { toast.error(res.message); } setUserToUnban(null); }); }} />}
            </AnimatePresence>
        </div>
    );
}