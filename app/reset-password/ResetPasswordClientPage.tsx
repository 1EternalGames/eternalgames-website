// app/reset-password/ResetPasswordClientPage.tsx
'use client';

import { useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/app/actions/authActions';
import { useToast } from '@/lib/toastStore';
import ButtonLoader from '@/components/ui/ButtonLoader';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const toast = useToast();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!token) {
            setMessage({ type: 'error', text: 'Invalid or missing reset token.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        startTransition(async () => {
            const result = await resetPassword(token, newPassword);
            if (result.success) {
                toast.success(result.message || 'Password reset successfully!');
                router.push('/'); // Redirect to homepage on success
            } else {
                setMessage({ type: 'error', text: result.message || 'Failed to reset password.' });
            }
        });
    };
    
    return (
        <div className="container page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div 
                style={{ maxWidth: '420px', width: '100%' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <form onSubmit={handleSubmit} className="profile-form" style={{ background: 'var(--bg-secondary)', padding: '3rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h1 className="page-title" style={{ fontSize: '2.8rem', marginTop: 0 }}>Reset Your Password</h1>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '-2rem', marginBottom: '3rem' }}>
                        Enter a new password for your account.
                    </p>

                    <div className="profile-form-group">
                        <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="profile-input" placeholder=" " />
                        <label htmlFor="newPassword" className="profile-form-label">كلمة السر الجديدة</label>
                    </div>
                    <div className="profile-form-group">
                        <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="profile-input" placeholder=" " />
                        <label htmlFor="confirmPassword" className="profile-form-label">تأكيد الجديدة</label>
                    </div>
                    
                    <AnimatePresence>
                        {message && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                style={{
                                    fontSize: '1.4rem', textAlign: 'center', margin: '0 0 1.5rem 0',
                                    color: message.type === 'error' ? '#DC2626' : '#16A34A'
                                }}
                            >
                                {message.text}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <button type="submit" className="primary-button" style={{ width: '100%' }} disabled={isPending}>
                        {isPending ? <ButtonLoader /> : 'إعادة تعيين كلمة السر'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}





