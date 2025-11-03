// components/PasswordChangeForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { changePasswordAction } from '@/app/actions/userActions';
import { useToast } from '@/lib/toastStore';
import ButtonLoader from './ui/ButtonLoader';
import { motion, AnimatePresence } from 'framer-motion';

export default function PasswordChangeForm() {
    const [isPending, startTransition] = useTransition();
    const toast = useToast();
    
    // --- DEFINITIVE FIX: Comment is now correctly formatted ---
    // State to manage form fields for floating labels
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const form = event.currentTarget;

        startTransition(async () => {
            const result = await changePasswordAction(formData);
            if (result.success) {
                toast.success(result.message || 'تم تغيير كلمة السر بنجاح!');
                // Clear state on success
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                form.reset();
            } else {
                toast.error(result.message || 'Failed to change password.');
            }
        });
    };

    const hasContent = (value: string) => value ? 'has-content' : '';

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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








