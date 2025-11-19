// app/studio/director/UserManagementClient.tsx
'use client';

import { useState, useMemo, useTransition } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { EditRolesModal } from './EditRolesModal';
import type { User, Role } from '@prisma/client';
import { translateRole } from '@/lib/translations';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';
import { toggleUserBanAction } from '@/app/actions/banActions';
import { useToast } from '@/lib/toastStore';
import { useRouter } from 'next/navigation';

// Extended type to include ban status
type UserWithRoles = User & { roles: { name: string }[] };

const BanModal = ({ user, onClose, onConfirm }: { user: UserWithRoles, onClose: () => void, onConfirm: (reason: string) => void }) => {
    const [reason, setReason] = useState('');

    return (
        <Modal isOpen={!!user} onClose={onClose}>
            <h3 style={{ marginTop: 0, color: '#DC2626' }}>حظر المستخدم: {user.name}</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '-1rem' }}>سيتم منع هذا المستخدم من الوصول إلى الموقع.</p>
            
            <div style={{ margin: '2rem 0' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>سبب الحظر:</label>
                <textarea 
                    className="profile-input" 
                    rows={3} 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="مثال: مخالفة شروط المجتمع..."
                />
            </div>

            <div className={modalStyles.modalActions}>
                <button onClick={onClose} className="outline-button">إلغاء</button>
                <button 
                    onClick={() => onConfirm(reason)} 
                    className="primary-button delete-forever"
                    disabled={!reason.trim()}
                >
                    تأكيد الحظر
                </button>
            </div>
        </Modal>
    );
};

const UnbanModal = ({ user, onClose, onConfirm }: { user: UserWithRoles, onClose: () => void, onConfirm: () => void }) => {
    return (
        <Modal isOpen={!!user} onClose={onClose}>
            <h3 style={{ marginTop: 0 }}>رفع الحظر عن {user.name}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>هل أنت متأكد من استعادة صلاحيات هذا المستخدم؟</p>
            <div className={modalStyles.modalActions}>
                <button onClick={onClose} className="outline-button">إلغاء</button>
                <button onClick={onConfirm} className="primary-button">تأكيد رفع الحظر</button>
            </div>
        </Modal>
    );
};

const UserRow = ({ user, allRoles, onEdit, onBanClick }: { user: UserWithRoles, allRoles: Role[], onEdit: (user: UserWithRoles) => void, onBanClick: (user: UserWithRoles) => void }) => {
    const currentRoleNames = user.roles.map(r => r.name);
    const rolesToDisplay = currentRoleNames.filter(name => name !== 'USER').sort();
    const displayString = rolesToDisplay.length > 0 ? rolesToDisplay.map(translateRole).join('، ') : 'عضو (افتراضي)';
    
    const isBanned = user.isBanned;

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`user-row ${isBanned ? 'banned' : ''}`}
        >
            <div className="user-info">
                <div style={{ position: 'relative' }}>
                    <Image src={user.image || '/default-avatar.svg'} alt={user.name || 'avatar'} width={40} height={40} className="user-avatar" style={{ filter: isBanned ? 'grayscale(100%)' : 'none' }} />
                    {isBanned && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, background: '#DC2626', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }} />}
                </div>
                <div>
                    <p className="user-name" style={{ color: isBanned ? '#DC2626' : 'inherit', textDecoration: isBanned ? 'line-through' : 'none' }}>{user.name}</p>
                    <p className="user-email">{user.email}</p>
                </div>
            </div>
            <div className="user-roles">
                <span className="roles-badge">{displayString}</span>
            </div>
            <div className="user-actions">
                <button className="outline-button" onClick={() => onEdit(user)} disabled={isBanned} style={{ opacity: isBanned ? 0.5 : 1 }}>الرتب</button>
                <button 
                    className="outline-button" 
                    onClick={() => onBanClick(user)}
                    style={{ 
                        borderColor: isBanned ? 'var(--border-color)' : '#DC2626', 
                        color: isBanned ? 'var(--text-secondary)' : '#DC2626',
                        backgroundColor: isBanned ? 'transparent' : 'rgba(220, 38, 38, 0.05)'
                    }}
                >
                    {isBanned ? 'رفع الحظر' : 'حظر'}
                </button>
            </div>
        </motion.div>
    );
};

export function UserManagementClient({ initialUsers, allRoles }: { initialUsers: UserWithRoles[], allRoles: Role[] }) {
    const [users, setUsers] = useState<UserWithRoles[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
    
    // Ban Modal State
    const [userToBan, setUserToBan] = useState<UserWithRoles | null>(null);
    const [userToUnban, setUserToUnban] = useState<UserWithRoles | null>(null);
    const [isPending, startTransition] = useTransition();
    const toast = useToast();
    const router = useRouter();

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(u =>
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleUpdateUserRoles = (userId: string, newRoles: Role[]) => {
        setUsers(currentUsers => currentUsers.map(u => 
            u.id === userId ? { ...u, roles: newRoles.map(r => ({ name: r.name })) } : u
        ));
    };
    
    // Ban Handlers
    const handleBan = (reason: string) => {
        if (!userToBan) return;
        const userId = userToBan.id;
        
        startTransition(async () => {
            const result = await toggleUserBanAction(userId, reason, true);
            if (result.success) {
                setUsers(current => current.map(u => u.id === userId ? { ...u, isBanned: true, banReason: reason } : u));
                toast.success(result.message);
                setUserToBan(null);
                router.refresh(); // Update server components to reflect changes
            } else {
                toast.error(result.message);
            }
        });
    };

    const handleUnban = () => {
        if (!userToUnban) return;
        const userId = userToUnban.id;

        startTransition(async () => {
            const result = await toggleUserBanAction(userId, '', false);
            if (result.success) {
                setUsers(current => current.map(u => u.id === userId ? { ...u, isBanned: false, banReason: null } : u));
                toast.success(result.message);
                setUserToUnban(null);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        });
    };

    const onBanButtonClick = (user: UserWithRoles) => {
        if (user.isBanned) {
            setUserToUnban(user);
        } else {
            setUserToBan(user);
        }
    };

    return (
        <>
            <style jsx>{`
                .user-management-container { max-width: 960px; margin: 0 auto; }
                .search-input { width: 100%; margin-bottom: 2rem; }
                .user-list-header, .user-row { 
                    display: grid; 
                    grid-template-columns: 2fr 1.5fr 1fr; /* Increased last col width */
                    align-items: center; 
                    gap: 1rem; 
                    padding: 1rem; 
                    border-bottom: 1px solid var(--border-color); 
                }
                .user-row.banned {
                    background-color: rgba(220, 38, 38, 0.05);
                }
                .user-list-header { font-weight: 600; color: var(--text-secondary); font-family: var(--font-main); }
                .user-info { display: flex; align-items: center; gap: 1rem; }
                .user-name { font-weight: 600; margin: 0; }
                .user-email { font-size: 1.4rem; color: var(--text-secondary); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
                .roles-badge { 
                    background-color: var(--bg-secondary); 
                    padding: 0.4rem 0.8rem; 
                    border-radius: 6px; 
                    font-size: 1.3rem; 
                    border: 1px solid var(--border-color); 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis;
                }
                .user-actions { text-align: left; display: flex; justify-content: flex-end; gap: 0.5rem; }

                @media (max-width: 768px) {
                    .user-list-header { display: none; }
                    .user-row { grid-template-columns: 1fr; gap: 1.5rem; padding: 1.5rem; }
                    .user-info { grid-column: 1; }
                    .user-roles { grid-column: 1; justify-self: start; }
                    .user-actions { grid-column: 1; width: 100%; justify-content: space-between; }
                }
            `}</style>
            <div className="user-management-container">
                <input type="search" placeholder="ابحث بالاسم أو البريد..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="profile-input search-input" />
                <div className="user-list">
                    <div className="user-list-header">
                        <span>العضو</span>
                        <span>الرتب</span>
                        <span>الإجراءات</span>
                    </div>
                    <AnimatePresence>
                        {filteredUsers.map(user => (
                            <UserRow key={user.id} user={user} allRoles={allRoles} onEdit={setSelectedUser} onBanClick={onBanButtonClick} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
            
            <AnimatePresence>
                {selectedUser && ( <EditRolesModal user={selectedUser} allRoles={allRoles} onClose={() => setSelectedUser(null)} onUpdate={handleUpdateUserRoles} /> )}
                {userToBan && ( <BanModal user={userToBan} onClose={() => setUserToBan(null)} onConfirm={handleBan} /> )}
                {userToUnban && ( <UnbanModal user={userToUnban} onClose={() => setUserToUnban(null)} onConfirm={handleUnban} /> )}
            </AnimatePresence>
        </>
    );
}