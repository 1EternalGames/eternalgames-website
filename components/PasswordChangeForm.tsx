// components/PasswordChangeForm.tsx
'use client';

import { useState } from 'react';
import { changePasswordAction } from '@/app/actions/userActions';
import { useServerAction } from '@/hooks/useServerAction'; // <-- IMPORT HOOK
import ButtonLoader from './ui/ButtonLoader';
import { motion, AnimatePresence } from 'framer-motion';

export default function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const formRef = useRef<HTMLFormElement>(null);

    const { execute: executeChangePassword, isPending } = useServerAction(changePasswordAction, {
        onSuccess: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            formRef.current?.reset();
        }
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        executeChangePassword(formData);
    };

    const hasContent = (value: string) => value ? 'has-content' : '';

    return (
        <form ref={formRef} onSubmit={handleSubmit} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className={`profile-form-group ${hasContent(currentPassword)}`}>
                <input 
                    id="currentPassword" 
                    name="currentPassword" 
                    type="password" 
                    required 
                    className="profile-input" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder=" "
                />
                 <label className="profile-form-label" htmlFor="currentPassword">كلمة السر الحالية</label>
            </div>
            <div className={`profile-form-group ${hasContent(newPassword)}`}>
                <input 
                    id="newPassword" 
                    name="newPassword" 
                    type="password" 
                    required 
                    className="profile-input" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder=" "
                />
                <label className="profile-form-label" htmlFor="newPassword">كلمة السر الجديدة</label>
            </div>
            <div className={`profile-form-group ${hasContent(confirmPassword)}`}>
                <input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    required 
                    className="profile-input" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder=" "
                />
                <label className="profile-form-label" htmlFor="confirmPassword">تأكيد كلمة السر الجديدة</label>
            </div>
            <motion.button 
                type="submit" 
                className="primary-button" 
                disabled={isPending}
                animate={{
                    width: isPending ? '48px' : 'auto',
                    height: '48px',
                    borderRadius: isPending ? '50%' : '5px',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <AnimatePresence mode="wait">
                    {isPending ? (
                        <ButtonLoader key="loader" />
                    ) : (
                        <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>تحديث كلمة السر</motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </form>
    );
}