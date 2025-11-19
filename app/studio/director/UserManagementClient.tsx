// app/studio/director/UserManagementClient.tsx

'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { EditRolesModal } from './EditRolesModal';
import type { User, Role } from '@prisma/client';
import { translateRole } from '@/lib/translations'; // <-- THE FIX: Import translator

type UserWithRoles = User & { roles: { name: string }[] };

const UserRow = ({ user, allRoles, onEdit }: { user: UserWithRoles, allRoles: Role[], onEdit: (user: UserWithRoles) => void }) => {
    const currentRoleNames = user.roles.map(r => r.name);
    // Filter out USER to show only special ranks
    const rolesToDisplay = currentRoleNames.filter(name => name !== 'USER').sort();
    
    // THE FIX: Translate the roles before joining them
    const displayString = rolesToDisplay.length > 0 
        ? rolesToDisplay.map(translateRole).join('، ') 
        : 'عضو (افتراضي)';
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="user-row"
        >
            <div className="user-info">
                <Image src={user.image || '/default-avatar.svg'} alt={user.name || 'avatar'} width={40} height={40} className="user-avatar" />
                <div>
                    <p className="user-name">{user.name}</p>
                    <p className="user-email">{user.email}</p>
                </div>
            </div>
            <div className="user-roles">
                <span className="roles-badge">{displayString}</span>
            </div>
            <div className="user-actions">
                <button className="outline-button" onClick={() => onEdit(user)}>تعديل الرتب</button>
            </div>
        </motion.div>
    );
};


export function UserManagementClient({ initialUsers, allRoles }: { initialUsers: UserWithRoles[], allRoles: Role[] }) {
    const [users, setUsers] = useState<UserWithRoles[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);

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

    return (
        <>
            <style jsx>{`
                .user-management-container { max-width: 960px; margin: 0 auto; }
                .search-input { width: 100%; margin-bottom: 2rem; }
                .user-list-header, .user-row { 
                    display: grid; 
                    grid-template-columns: 2fr 1.5fr 0.5fr; 
                    align-items: center; 
                    gap: 1rem; 
                    padding: 1rem; 
                    border-bottom: 1px solid var(--border-color); 
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
                .user-actions { text-align: left; }

                @media (max-width: 768px) {
                    .user-list-header {
                        display: none;
                    }
                    .user-row {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                        padding: 1.5rem;
                    }
                    .user-info {
                        grid-column: 1;
                    }
                    .user-roles {
                        grid-column: 1;
                        justify-self: start;
                    }
                    .user-actions {
                        grid-column: 1;
                        text-align: right;
                    }
                }
            `}</style>
            <div className="user-management-container">
                <input
                    type="search"
                    placeholder="ابحث بالاسم أو البريد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="profile-input search-input"
                />
                <div className="user-list">
                    <div className="user-list-header">
                        <span>العضو</span>
                        <span>الرتب</span>
                        <span></span>
                    </div>
                    <AnimatePresence>
                        {filteredUsers.map(user => (
                            <UserRow key={user.id} user={user} allRoles={allRoles} onEdit={setSelectedUser} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
            
            <AnimatePresence>
                {selectedUser && (
                    <EditRolesModal
                        user={selectedUser}
                        allRoles={allRoles}
                        onClose={() => setSelectedUser(null)}
                        onUpdate={handleUpdateUserRoles}
                    />
                )}
            </AnimatePresence>
        </>
    );
}